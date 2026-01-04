#!/bin/bash
echo "Adding changes..."
git add .
echo "Committing..."
git commit -m "Update $(date)"
echo "Pushing to GitHub..."
if git remote | grep -q 'origin'; then
  git push origin main
else
  echo "No remote 'origin' found. Please add a remote to push to."
  echo "You can do this by running: git remote add origin <your-repo-url>"
fi
