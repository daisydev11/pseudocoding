# A2. Three functions I did not write

**Status: not done yet.** The brief forbids AI for the first pass, so nothing in this folder is filled in by an AI.

## Steps

1. Pick one open-source library I actually use and three of its functions: one short, one medium, one that takes a while to follow.
2. Read the source. Write pseudocode for each in `01-short.md`, `02-medium.md`, `03-long.md`, using the template below. No AI.
3. Hand-trace each with three inputs: normal, edge, invalid.
4. Run the real function with the same inputs and record the output.
5. Only then ask an AI to explain each function. Paste its explanation under "AI comparison".
6. List every place my understanding and the AI's differ, re-read the code, and say who was right.

## Template for each file

````
# A2.n <library> `<function>`

Source: <link to the exact file and line>

## Pseudocode (written by me, no AI)

```
FUNCTION name
INPUTS:
OUTPUT:
SIDE EFFECTS:
FAILS WHEN:
```

1. ...

## Hand trace

| Input | Step | What happens | Values after |
|---|---|---|---|

## Real run

| Input | Predicted | Real output | Match |
|---|---|---|---|

## AI comparison

AI used and date:
The AI's explanation (pasted, unedited):

| # | Where we differed | What I wrote | What the AI said | Who was right, checked against the code |
|---|---|---|---|---|
````
