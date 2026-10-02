#!/bin/bash

# Script to build Lambda layer with Python dependencies

set -e

echo "Building Lambda layer..."

LAYER_DIR="lambda/layers/dependencies"
BUILD_DIR="$LAYER_DIR/python"

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Using Docker to build for Lambda environment..."
    docker run --rm -v "$PWD/$LAYER_DIR":/var/task public.ecr.aws/lambda/python:3.11 \
        pip install -r /var/task/requirements.txt -t /var/task/python
else
    echo "Docker not found, using local pip3..."
    # Try with platform-specific wheel
    pip3 install --platform manylinux2014_x86_64 --only-binary=:all: -r "$LAYER_DIR/requirements.txt" -t "$BUILD_DIR" 2>/dev/null || \
    pip3 install -r "$LAYER_DIR/requirements.txt" -t "$BUILD_DIR"
fi

echo "✅ Lambda layer built successfully!"
echo "Layer directory: $BUILD_DIR"
