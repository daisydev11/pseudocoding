# A1.1 The most complex one: `paginate`

Source: [`food-market-api/src/lib/list.ts`](https://github.com/daisydev11/food-market-api/blob/main/src/lib/list.ts). Every list endpoint of the Food Market API calls it.

## Pseudocode

```
FUNCTION paginate
INPUTS:
  query   - the validated list request: limit (whole number, 1 to 100), sort (field name),
            order ("asc" or "desc"), and optionally EITHER offset (whole number, 0 or more)
            OR cursor (the id of the last item the client already has)
  source  - how to reach one collection: a filter, a way to count rows matching the filter,
            a way to fetch rows, and a way to check that an id exists
OUTPUT: an object with
  data - list of rows, at most limit long
  meta - total (number), limit (number), offset (number, or nothing in cursor mode),
         hasMore (true/false), nextCursor (an id, or nothing)
SIDE EFFECTS: NONE (it only reads)
FAILS WHEN:
  - a cursor is given and no record has that id -> error 400 INVALID_CURSOR
  - the database cannot be reached -> the database error passes through unchanged
```

1. Build the sort order: the requested sort field in the requested direction, then the id in the same direction.
2. IF the requested sort field is the id itself
       use the id alone as the sort order
3. IF a cursor is given
       CALL the database to check a record with that id exists (may fail, may be slow)
       IF it does not exist
           RETURN error 400 INVALID_CURSOR, naming the cursor parameter
4. Do steps 5 and 6 at the same time and wait for both.
5. CALL the database to count every row matching the filter (may fail, may be slow). Call this total.
6. CALL the database to fetch rows matching the filter, in the sort order, asking for limit plus one rows:
       IF a cursor is given
           start at the cursor's row and skip that one row
       OTHERWISE IF an offset is given and it is not zero
           skip offset rows
       OTHERWISE
           start at the first row
7. IF more rows came back than limit
       set hasMore to true
       keep only the first limit rows as data
   OTHERWISE
       set hasMore to false
       keep all the rows as data
8. IF hasMore is true
       set nextCursor to the id of the last row in data
   OTHERWISE
       set nextCursor to nothing
9. IF a cursor was given
       set the reported offset to nothing
   OTHERWISE
       set the reported offset to the given offset, or zero if none was given
10. RETURN data, and meta made of total, limit, the reported offset, hasMore and nextCursor.

## Hand trace

The collection for all traces: five restaurants, no filter, sorted by name ascending.

| id | name |
|---|---|
| r1 | Amala Spot |
| r2 | Buka Hut |
| r3 | Chop House |
| r4 | Dodo Place |
| r5 | Egusi Pot |

### Input 1, normal: limit 2, sort name asc, no cursor, no offset

| Step | What happens | Values after |
|---|---|---|
| 1 | sort order built | name asc, then id asc |
| 2 | sort is not id | unchanged |
| 3 | no cursor | skipped |
| 5 | count | total = 5 |
| 6 | fetch 3 rows from the start | r1, r2, r3 |
| 7 | 3 > 2 | hasMore = true, data = r1, r2 |
| 8 | hasMore | nextCursor = r2 |
| 9 | no cursor, no offset | offset = 0 |
| 10 | return | data [r1, r2], meta {total 5, limit 2, offset 0, hasMore true, nextCursor r2} |

### Input 2, edge (the last page, by cursor): limit 2, cursor r4

| Step | What happens | Values after |
|---|---|---|
| 3 | r4 exists | continue |
| 5 | count | total = 5 |
| 6 | start at r4, skip it, fetch up to 3 | r5 |
| 7 | 1 is not > 2 | hasMore = false, data = r5 |
| 8 | not hasMore | nextCursor = nothing |
| 9 | cursor given | offset = nothing |
| 10 | return | data [r5], meta {total 5, limit 2, offset null, hasMore false, nextCursor null} |

### Input 3, invalid: limit 2, cursor "nope"

| Step | What happens | Values after |
|---|---|---|
| 3 | no record has id "nope" | RETURN error 400 INVALID_CURSOR |
| 5, 6 | never reached | the count and the fetch are not called |

### Input 4, extra edge (asked in the defence: a page past the end): limit 2, offset 100

| Step | What happens | Values after |
|---|---|---|
| 5 | count | total = 5 |
| 6 | skip 100, fetch up to 3 | no rows |
| 7 | 0 is not > 2 | hasMore = false, data empty |
| 10 | return | data [], meta {total 5, limit 2, offset 100, hasMore false, nextCursor null} |

## Real run and comparison

The real function was run with the same four inputs against an in-memory stand-in for the database ([harness](runs/paginate.harness.ts), [output](runs/paginate.run.txt)).

| Input | Trace predicted | Real output | Match |
|---|---|---|---|
| 1 | data [r1, r2]; total 5, offset 0, hasMore true, nextCursor r2 | `{"data":["r1","r2"],"meta":{"total":5,"limit":2,"offset":0,"hasMore":true,"nextCursor":"r2"}}` | yes |
| 2 | data [r5]; offset null, hasMore false, nextCursor null | `{"data":["r5"],"meta":{"total":5,"limit":2,"offset":null,"hasMore":false,"nextCursor":null}}` | yes |
| 3 | error 400 INVALID_CURSOR; count and fetch never called | `threw 400 INVALID_CURSOR`; database calls: `exists` only | yes |
| 4 | data []; total 5, offset 100, hasMore false | `{"data":[],"meta":{"total":5,"limit":2,"offset":100,"hasMore":false,"nextCursor":null}}` | yes |

**Discrepancies:** none in the outputs.

**What writing it out exposed:** step 6 has a branch that is easy to miss in the code. `query.offset ? … : …` treats an offset of 0 as "no offset". The result is the same (skip nothing), which is why the pseudocode says "an offset is given *and it is not zero*". Written as "IF an offset is given", the pseudocode would have described different code.
