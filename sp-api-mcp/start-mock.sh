#!/bin/bash
# Wrapper script for Amazon Quick Desktop — avoids path-with-spaces issues
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/dist/index.js" --config "$DIR/config.example.json" --mode local --mock
