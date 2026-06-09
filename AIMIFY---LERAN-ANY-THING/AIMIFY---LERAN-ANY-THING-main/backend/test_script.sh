#!/bin/bash
echo "Creating Session..."
RES=$(curl -s -X POST http://127.0.0.1:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_name": "Test", "subject": "React Hooks"}')
echo "$RES"
SESSION_ID=$(echo "$RES" | grep -o '\"session_id\":\"[^\"]*' | cut -d'"' -f4)
echo "Got Session ID: $SESSION_ID"

echo -e "\nSubmitting Diagnostic..."
curl -s -X POST "http://127.0.0.1:8000/api/session/$SESSION_ID/diagnostic" \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"question_index": 0, "selected_index": 1}, {"question_index": 1, "selected_index": 0}, {"question_index": 2, "selected_index": 2}, {"question_index": 3, "selected_index": 1}, {"question_index": 4, "selected_index": 0}]}'

echo -e "\n\nGetting Concept..."
curl -s "http://127.0.0.1:8000/api/session/$SESSION_ID/concept"

echo -e "\n\nSubmitting Assessment..."
curl -s -X POST "http://127.0.0.1:8000/api/session/$SESSION_ID/assess" \
  -H "Content-Type: application/json" \
  -d '{"answers": ["Hooks allow functional components to use state and lifecycle features", "useState returns a state value and a setter function"]}'

echo -e "\n\nGetting Progress..."
curl -s "http://127.0.0.1:8000/api/session/$SESSION_ID/progress"
