#!/bin/bash
echo "Command Center"
echo "[q] Deploy to GitHub"
echo "[l] Start Dev Server"
echo "---------------------------------"
while true; do
  read -rsn1 input
  if [[ "$input" == "q" ]]; then
    echo "Deploying..."
    ./deploy.sh
    echo "Done. Ready for command..."
  elif [[ "$input" == "l" || "$input" == "L" ]]; then
    echo "Starting Dev Server..."
    ./l
    # If dev server exits, we print the menu again
    echo "Dev Server stopped. Ready for command..."
    echo "[q] Deploy to GitHub"
    echo "[l] Start Dev Server"
  fi
done
