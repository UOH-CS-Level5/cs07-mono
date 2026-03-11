import json
import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

BASE_URL = "https://canvas.hull.ac.uk/api/v1"
ENV_FILE = Path(__file__).with_name(".env")


def run_curl(url: str) -> str:
    result = subprocess.run(
        ["curl", "-fsSL", url],
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)
        sys.exit(result.returncode or 1)

    return result.stdout


def main() -> None:
    load_dotenv(dotenv_path=ENV_FILE)

    access_token = (
        os.getenv("ACCESS_TOKEN")
        or os.getenv("CANVAS_API_KEY")
        or os.getenv("CANVAS_ACCESS_TOKEN")
    )

    if not access_token:
        print(
            f"Missing Canvas API token in {ENV_FILE}. "
            "Set ACCESS_TOKEN, CANVAS_API_KEY, or CANVAS_ACCESS_TOKEN.",
            file=sys.stderr,
        )
        sys.exit(1)

    courses_url = (
        f"{BASE_URL}/courses"
        f"?access_token={access_token}&enrollment_state=active&per_page=100"
    )

    try:
        courses = json.loads(run_curl(courses_url))
    except json.JSONDecodeError:
        print("Unexpected response for courses endpoint.", file=sys.stderr)
        sys.exit(1)

    if not isinstance(courses, list):
        print("Unexpected response for courses endpoint.", file=sys.stderr)
        sys.exit(1)

    active_courses = []
    seen_ids = set()

    for course in courses:
        if not isinstance(course, dict):
            continue

        workflow_state = str(course.get("workflow_state", "")).lower()
        course_id = course.get("id")

        if workflow_state != "available":
            continue

        if course_id is None or course_id in seen_ids:
            continue

        seen_ids.add(course_id)
        active_courses.append(course)

    if not active_courses:
        print("No active courses found.")
        sys.exit(0)

    print(f"Found {len(active_courses)} active course(s).", file=sys.stderr)

    for course in active_courses:
        course_id = course["id"]
        course_name = (
            course.get("name") or course.get("course_code") or f"Course {course_id}"
        )

        print(f"\n=== Course {course_id}: {course_name} ===", file=sys.stderr)

        assignments_url = (
            f"{BASE_URL}/courses/{course_id}/assignments"
            f"?access_token={access_token}&per_page=100"
        )

        try:
            assignments = json.loads(run_curl(assignments_url))
        except json.JSONDecodeError:
            print(f"Invalid JSON returned for course {course_id}.", file=sys.stderr)
            continue

        output = {
            "course_id": course_id,
            "course_name": course_name,
            "assignments": assignments,
        }

        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
