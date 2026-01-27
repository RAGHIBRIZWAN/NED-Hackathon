"""
Problems API Routes
==================
API endpoints for hardcoded CP problems and module coding problems.
Supports Python, C++, and JavaScript code execution with test case evaluation.
"""

import asyncio
import subprocess
import tempfile
import os
import time
import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.models.user import User
from app.data.cp_problems import CP_PROBLEMS, get_problem_by_id, get_problems_by_rating
from app.data.module_problems import (
    get_mcqs_by_module, get_coding_problems_by_module, get_mcq_by_id,
    get_coding_problem_by_id, get_all_mcqs, get_all_coding_problems
)

router = APIRouter()


# ============ Schemas ============

class RunCodeRequest(BaseModel):
    """Request to run code."""
    code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(..., description="python, cpp, or javascript")
    stdin: str = Field(default="", description="Input for the program")


class SubmitSolutionRequest(BaseModel):
    """Request to submit a solution for judging."""
    problem_id: str
    code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(..., description="python, cpp, or javascript")


class TestResult(BaseModel):
    """Result of a single test case."""
    test_number: int
    passed: bool
    input_data: str
    expected_output: str
    actual_output: Optional[str] = None
    execution_time_ms: int
    error: Optional[str] = None


class SubmissionResult(BaseModel):
    """Result of code submission."""
    verdict: str
    verdict_message: str
    passed_tests: int
    total_tests: int
    execution_time_ms: int
    test_results: List[TestResult]


class ExamQuestion(BaseModel):
    """Question in an exam (MCQ or Coding)."""
    type: str  # "mcq" or "coding"
    question_data: dict


class ModuleExam(BaseModel):
    """Complete exam for a module."""
    module_id: str
    module_name: str
    total_mcqs: int
    total_coding: int
    questions: List[ExamQuestion]


# ============ Code Executor ============

class MultiLangExecutor:
    """Execute code in Python, C++, or JavaScript."""
    
    TIME_LIMIT = 5  # seconds
    
    @staticmethod
    async def execute(code: str, language: str, stdin: str) -> dict:
        """Execute code and return result."""
        
        if language == "python":
            return await MultiLangExecutor._execute_python(code, stdin)
        elif language == "cpp":
            return await MultiLangExecutor._execute_cpp(code, stdin)
        elif language == "javascript":
            return await MultiLangExecutor._execute_javascript(code, stdin)
        else:
            return {
                "output": "",
                "error": f"Unsupported language: {language}",
                "execution_time_ms": 0,
                "status": "error"
            }
    
    @staticmethod
    async def _execute_python(code: str, stdin: str) -> dict:
        """Execute Python code."""
        
        # Security check
        forbidden = ["import os", "import sys", "import subprocess", "__import__", "eval(", "exec(", "open("]
        code_lower = code.lower()
        for f in forbidden:
            if f in code_lower:
                return {"output": "", "error": f"Forbidden: {f}", "execution_time_ms": 0, "status": "error"}
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            code_file = f.name
        
        try:
            start = time.time()
            process = subprocess.run(
                ["python", code_file],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000],
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        finally:
            try:
                os.unlink(code_file)
            except:
                pass
    
    @staticmethod
    async def _execute_cpp(code: str, stdin: str) -> dict:
        """Execute C++ code."""
        
        # Add header to fix MinGW ssize_t issue - define ssize_t before any includes
        mingw_fix = """#ifndef _SSIZE_T_DEFINED
#define _SSIZE_T_DEFINED
#include <stddef.h>
typedef ptrdiff_t ssize_t;
#endif
"""
        fixed_code = mingw_fix + code
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
            f.write(fixed_code)
            code_file = f.name
        
        exe_file = code_file.replace('.cpp', '.exe' if os.name == 'nt' else '')
        
        try:
            # Compile with C++14 standard and proper flags
            compile_result = subprocess.run(
                ["g++", code_file, "-o", exe_file, "-std=c++14", "-O2", "-static-libgcc", "-static-libstdc++"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if compile_result.returncode != 0:
                return {
                    "output": "",
                    "error": f"Compilation Error:\n{compile_result.stderr[:1000]}",
                    "execution_time_ms": 0,
                    "status": "compile_error"
                }
            
            # Execute
            start = time.time()
            process = subprocess.run(
                [exe_file],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000] or "Runtime Error",
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        except FileNotFoundError:
            return {"output": "", "error": "C++ compiler (g++) not found. Please install it.", "execution_time_ms": 0, "status": "error"}
        finally:
            try:
                os.unlink(code_file)
                if os.path.exists(exe_file):
                    os.unlink(exe_file)
            except:
                pass
    
    @staticmethod
    async def _execute_javascript(code: str, stdin: str) -> dict:
        """Execute JavaScript code with Node.js."""
        
        # Wrap code to read from stdin
        escaped_stdin = stdin.replace('`', '\\`')
        newline = '\\n'
        wrapped_code = f"""
const readline = require('readline');
const input = `{escaped_stdin}`.trim().split('{newline}');
let inputIndex = 0;
const readLine = () => input[inputIndex++] || '';

{code}
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(wrapped_code)
            code_file = f.name
        
        try:
            start = time.time()
            process = subprocess.run(
                ["node", code_file],
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000],
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        except FileNotFoundError:
            return {"output": "", "error": "Node.js not found. Please install it.", "execution_time_ms": 0, "status": "error"}
        finally:
            try:
                os.unlink(code_file)
            except:
                pass


# ============ CP Problems Routes ============

@router.get("/cp/problems")
async def get_cp_problems(
    rating_min: Optional[int] = Query(None, ge=800, le=3500),
    rating_max: Optional[int] = Query(None, ge=800, le=3500),
    difficulty: Optional[str] = Query(None, description="easy, medium, hard, expert"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get competitive programming problems with filtering."""
    
    problems = CP_PROBLEMS.copy()
    
    # Filter by rating
    if rating_min:
        problems = [p for p in problems if p["rating"] >= rating_min]
    if rating_max:
        problems = [p for p in problems if p["rating"] <= rating_max]
    
    # Filter by difficulty
    if difficulty:
        problems = [p for p in problems if p["difficulty"] == difficulty]
    
    # Pagination
    total = len(problems)
    start = (page - 1) * limit
    end = start + limit
    problems = problems[start:end]
    
    # Return without test cases for list view
    return {
        "problems": [
            {
                "id": p["id"],
                "name": p["name"],
                "rating": p["rating"],
                "difficulty": p["difficulty"],
                "tags": p["tags"]
            }
            for p in problems
        ],
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/cp/problems/{problem_id}")
async def get_cp_problem_detail(problem_id: str):
    """Get full details of a CP problem including examples."""
    
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Return full problem but without test cases
    return {
        "id": problem["id"],
        "name": problem["name"],
        "rating": problem["rating"],
        "difficulty": problem["difficulty"],
        "tags": problem["tags"],
        "description": problem["description"],
        "input_format": problem["input_format"],
        "output_format": problem["output_format"],
        "examples": problem["examples"],
        "solution_hint": problem.get("solution_hint", "")
    }


# ============ Module Problems Routes ============

@router.get("/modules/{module_id}/mcqs")
async def get_module_mcqs(
    module_id: str,
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50)
):
    """Get MCQ questions for a module."""
    
    mcqs = get_mcqs_by_module(module_id)
    
    if not mcqs:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    # Filter
    if difficulty:
        mcqs = [m for m in mcqs if m["difficulty"] == difficulty]
    if topic:
        mcqs = [m for m in mcqs if topic.lower() in m["topic"].lower()]
    
    # Limit results
    mcqs = mcqs[:limit]
    
    # Remove correct answer for quiz mode
    return {
        "module_id": module_id,
        "total": len(mcqs),
        "questions": [
            {
                "id": m["id"],
                "topic": m["topic"],
                "difficulty": m["difficulty"],
                "question": m["question"],
                "options": [{"id": o["id"], "text": o["text"]} for o in m["options"]]
            }
            for m in mcqs
        ]
    }


@router.post("/modules/mcqs/{mcq_id}/check")
async def check_mcq_answer(mcq_id: str, selected_option: str):
    """Check if the selected answer is correct."""
    
    mcq = get_mcq_by_id(mcq_id)
    if not mcq:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = selected_option == mcq["correct_option"]
    
    return {
        "correct": is_correct,
        "correct_option": mcq["correct_option"],
        "explanation": mcq["explanation"]
    }


@router.get("/modules/{module_id}/coding")
async def get_module_coding_problems(
    module_id: str,
    difficulty: Optional[str] = None
):
    """Get coding problems for a module."""
    
    problems = get_coding_problems_by_module(module_id)
    
    if not problems:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    if difficulty:
        problems = [p for p in problems if p["difficulty"] == difficulty]
    
    return {
        "module_id": module_id,
        "total": len(problems),
        "problems": [
            {
                "id": p["id"],
                "name": p["name"],
                "difficulty": p["difficulty"],
                "topic": p["topic"]
            }
            for p in problems
        ]
    }


@router.get("/modules/coding/{problem_id}")
async def get_coding_problem_detail(problem_id: str):
    """Get full details of a coding problem."""
    
    # Check CP problems first
    problem = get_problem_by_id(problem_id)
    if not problem:
        # Check module coding problems
        problem = get_coding_problem_by_id(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return {
        "id": problem["id"],
        "name": problem["name"],
        "difficulty": problem["difficulty"],
        "topic": problem.get("topic", ""),
        "tags": problem.get("tags", []),
        "description": problem["description"],
        "input_format": problem["input_format"],
        "output_format": problem["output_format"],
        "examples": problem["examples"],
        "rating": problem.get("rating")
    }


# ============ Code Execution Routes ============

@router.post("/run")
async def run_code(request: RunCodeRequest):
    """Run code with custom input."""
    
    result = await MultiLangExecutor.execute(
        request.code,
        request.language,
        request.stdin
    )
    
    return {
        "output": result["output"],
        "error": result["error"],
        "execution_time_ms": result["execution_time_ms"],
        "status": result["status"]
    }


@router.post("/submit/{problem_id}")
async def submit_solution(
    problem_id: str,
    request: SubmitSolutionRequest
):
    """Submit solution and judge against test cases."""
    
    # Find problem
    problem = get_problem_by_id(problem_id)
    if not problem:
        problem = get_coding_problem_by_id(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    test_cases = problem["test_cases"]
    test_results = []
    total_time = 0
    all_passed = True
    
    for i, tc in enumerate(test_cases):
        result = await MultiLangExecutor.execute(
            request.code,
            request.language,
            tc["input"]
        )
        
        expected = tc["output"].strip()
        actual = result["output"].strip()
        passed = result["status"] == "success" and actual == expected
        
        if not passed:
            all_passed = False
        
        test_results.append(TestResult(
            test_number=i + 1,
            passed=passed,
            input_data=tc["input"],
            expected_output=expected,
            actual_output=actual if result["status"] == "success" else None,
            execution_time_ms=result["execution_time_ms"],
            error=result["error"]
        ))
        
        total_time += result["execution_time_ms"]
        
        # Stop on first failure for efficiency
        if not passed and i >= 2:  # Run at least 3 tests
            # Add remaining tests as not run
            for j in range(i + 1, len(test_cases)):
                test_results.append(TestResult(
                    test_number=j + 1,
                    passed=False,
                    input_data=test_cases[j]["input"],
                    expected_output=test_cases[j]["output"],
                    actual_output=None,
                    execution_time_ms=0,
                    error="Skipped due to previous failure"
                ))
            break
    
    passed_count = sum(1 for tr in test_results if tr.passed)
    total_count = len(test_cases)
    
    if all_passed:
        verdict = "AC"
        verdict_message = f"Accepted! All {total_count} test cases passed."
    elif any(tr.error and "Time Limit" in tr.error for tr in test_results):
        verdict = "TLE"
        verdict_message = "Time Limit Exceeded"
    elif any(tr.error and "Compilation" in (tr.error or "") for tr in test_results):
        verdict = "CE"
        verdict_message = "Compilation Error"
    elif any(tr.error and tr.error and "Runtime" in tr.error for tr in test_results):
        verdict = "RE"
        verdict_message = "Runtime Error"
    else:
        first_failed = next((tr for tr in test_results if not tr.passed), None)
        verdict = "WA"
        verdict_message = f"Wrong Answer on test {first_failed.test_number if first_failed else '?'}"
    
    return SubmissionResult(
        verdict=verdict,
        verdict_message=verdict_message,
        passed_tests=passed_count,
        total_tests=total_count,
        execution_time_ms=total_time,
        test_results=test_results[:5]  # Only return first 5 test results
    )


# ============ Module Exam Routes ============

@router.get("/modules/{module_id}/exam")
async def generate_module_exam(
    module_id: str,
    mcq_count: int = Query(5, ge=1, le=15, description="Number of MCQ questions"),
    coding_count: int = Query(3, ge=1, le=10, description="Number of coding problems")
):
    """Generate a randomized exam for a module with MCQs and coding problems."""
    
    # Map module IDs to names
    module_names = {
        "programming-fundamentals": "Programming Fundamentals",
        "pf": "Programming Fundamentals",
        "oop": "Object-Oriented Programming",
        "data-structures": "Data Structures and Algorithms",
        "dsa": "Data Structures and Algorithms"
    }
    
    # Normalize module ID
    normalized_id = module_id.lower()
    if normalized_id == "pf":
        normalized_id = "programming-fundamentals"
    elif normalized_id == "dsa":
        normalized_id = "data-structures"
    
    # Get all MCQs and coding problems for the module
    all_mcqs = get_mcqs_by_module(normalized_id)
    all_coding = get_coding_problems_by_module(normalized_id)
    
    if not all_mcqs and not all_coding:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{module_id}' not found. Available modules: programming-fundamentals, oop, data-structures"
        )
    
    # Randomly select questions
    selected_mcqs = random.sample(all_mcqs, min(mcq_count, len(all_mcqs)))
    selected_coding = random.sample(all_coding, min(coding_count, len(all_coding)))
    
    # Prepare exam questions
    exam_questions = []
    
    # Add MCQs (without correct answer)
    for mcq in selected_mcqs:
        exam_questions.append({
            "type": "mcq",
            "question_data": {
                "id": mcq["id"],
                "topic": mcq["topic"],
                "difficulty": mcq["difficulty"],
                "question": mcq["question"],
                "options": [{"id": o["id"], "text": o["text"]} for o in mcq["options"]]
            }
        })
    
    # Add coding problems
    for coding in selected_coding:
        exam_questions.append({
            "type": "coding",
            "question_data": {
                "id": coding["id"],
                "name": coding["name"],
                "difficulty": coding["difficulty"],
                "topic": coding["topic"],
                "description": coding["description"],
                "input_format": coding["input_format"],
                "output_format": coding["output_format"],
                "examples": coding["examples"]
            }
        })
    
    # Shuffle all questions together
    random.shuffle(exam_questions)
    
    return {
        "module_id": normalized_id,
        "module_name": module_names.get(normalized_id, normalized_id),
        "total_mcqs": len(selected_mcqs),
        "total_coding": len(selected_coding),
        "total_questions": len(exam_questions),
        "questions": exam_questions,
        "instructions": [
            "Answer all questions to the best of your ability",
            "MCQ questions have only one correct answer",
            "Coding problems will be judged against hidden test cases",
            "Time limit: 5 seconds per code execution"
        ]
    }


@router.post("/modules/exam/submit")
async def submit_exam(
    module_id: str,
    mcq_answers: dict = {},
    coding_submissions: dict = {}
):
    """Submit exam answers and get results."""
    
    results = {
        "module_id": module_id,
        "mcq_results": [],
        "coding_results": [],
        "total_score": 0,
        "max_score": 0
    }
    
    # Check MCQ answers
    mcq_score = 0
    for mcq_id, selected_option in mcq_answers.items():
        mcq = get_mcq_by_id(mcq_id)
        if mcq:
            is_correct = selected_option == mcq["correct_option"]
            if is_correct:
                mcq_score += 1
            results["mcq_results"].append({
                "question_id": mcq_id,
                "correct": is_correct,
                "selected": selected_option,
                "correct_answer": mcq["correct_option"],
                "explanation": mcq["explanation"]
            })
    
    results["mcq_score"] = mcq_score
    results["total_mcqs"] = len(mcq_answers)
    
    # Check coding submissions
    coding_score = 0
    for problem_id, submission in coding_submissions.items():
        problem = get_coding_problem_by_id(problem_id)
        if problem:
            # Judge the submission
            test_cases = problem["test_cases"]
            passed = 0
            
            for tc in test_cases:
                result = await MultiLangExecutor.execute(
                    submission["code"],
                    submission["language"],
                    tc["input"]
                )
                if result["status"] == "success" and result["output"].strip() == tc["output"].strip():
                    passed += 1
            
            score = (passed / len(test_cases)) * 10  # 10 points per problem
            coding_score += score
            
            results["coding_results"].append({
                "problem_id": problem_id,
                "passed_tests": passed,
                "total_tests": len(test_cases),
                "score": score,
                "verdict": "AC" if passed == len(test_cases) else "WA"
            })
    
    results["coding_score"] = coding_score
    results["total_coding"] = len(coding_submissions)
    results["total_score"] = mcq_score + coding_score
    results["max_score"] = len(mcq_answers) + (len(coding_submissions) * 10)
    results["percentage"] = (results["total_score"] / results["max_score"] * 100) if results["max_score"] > 0 else 0
    
    return results


# ============ All Problems Summary ============

@router.get("/all/summary")
async def get_all_problems_summary():
    """Get summary of all available problems."""
    
    cp_count = len(CP_PROBLEMS)
    
    modules = {
        "programming-fundamentals": get_mcqs_by_module("programming-fundamentals"),
        "oop": get_mcqs_by_module("oop"),
        "data-structures": get_mcqs_by_module("data-structures")
    }
    
    coding = {
        "programming-fundamentals": get_coding_problems_by_module("programming-fundamentals"),
        "oop": get_coding_problems_by_module("oop"),
        "data-structures": get_coding_problems_by_module("data-structures")
    }
    
    return {
        "competitive_programming": {
            "total_problems": cp_count,
            "difficulty_breakdown": {
                "easy": len([p for p in CP_PROBLEMS if p["difficulty"] == "easy"]),
                "medium": len([p for p in CP_PROBLEMS if p["difficulty"] == "medium"]),
                "hard": len([p for p in CP_PROBLEMS if p["difficulty"] == "hard"]),
                "expert": len([p for p in CP_PROBLEMS if p["difficulty"] == "expert"])
            }
        },
        "modules": {
            module_id: {
                "mcq_count": len(mcqs),
                "coding_count": len(coding.get(module_id, []))
            }
            for module_id, mcqs in modules.items()
        }
    }
