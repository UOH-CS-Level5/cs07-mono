# Canvas Test

This folder contains a small Python script for fetching your active Canvas courses and the assignments for each course from the University of Hull Canvas API.

## Requirements

- [uv](https://docs.astral.sh/uv/)
- `curl`
- Python 3

## Setup

1. Create a `.env` file in this directory.
2. Add your Canvas API token to it:

```/dev/null/.env#L1-1
ACCESS_TOKEN=your_canvas_access_token_here
```

You can also use `CANVAS_API_KEY` or `CANVAS_ACCESS_TOKEN` instead of `ACCESS_TOKEN`.

## Install dependencies with uv

From this directory, install the required package:

```/dev/null/commands.sh#L1-2
uv sync
```

This creates a virtual environment and installs `python-dotenv`, which `main.py` uses to load values from `.env`.

## Run the script with uv

From this directory, run:

```/dev/null/commands.sh#L1-1
uv run main.py
```

## What the script does

The script will:

1. Read your Canvas API token from `.env`
2. Request your active courses from:

```/dev/null/url.txt#L1-1
https://canvas.hull.ac.uk/api/v1/courses
```

3. Extract each active course ID
4. Request assignments for each course from:

```/dev/null/url.txt#L1-1
https://canvas.hull.ac.uk/api/v1/courses/:course_id/assignments
```

5. Print the assignment data as formatted JSON

## Notes

- The script looks for `.env` in the same directory as `main.py`
- If your token is missing, the script will exit with an error
- The script currently requests up to 100 courses and 100 assignments per course
