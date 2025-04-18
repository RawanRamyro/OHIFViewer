#!/bin/bash

# Exit on any error
set -e

# Set working directory to the script location
cd "$(dirname "$0")"

# Configuration
CONTAINER_NAME="ohif-viewer-container"
IMAGE_NAME="ohif-viewer-image"
PORT="9003"
LOGFILE="./docker_log.txt"

# Function to log messages both to file and console
log_message() {
    local message="$1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOGFILE"
}

# Initialize log file
: > "$LOGFILE"
log_message "Starting OHIF Viewer deployment..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_message "ERROR: Docker daemon is not running. Please start Docker."
    exit 1
fi

# Clean up existing containers
if docker ps -a | grep -q $CONTAINER_NAME; then
    log_message "Stopping and removing existing container..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1 || log_message "No running container to stop."
    docker rm $CONTAINER_NAME >/dev/null 2>&1 || log_message "No container to remove."
fi

# Build the Docker image
log_message "Building Docker image '$IMAGE_NAME'..."
if ! docker build -t $IMAGE_NAME .; then
    log_message "ERROR: Docker build failed"
    exit 1
fi

# Run the Docker container
log_message "Running Docker container..."
if ! docker run -d \
    --name $CONTAINER_NAME \
    --restart=always \
    -p $PORT:80 \
    $IMAGE_NAME; then
    log_message "ERROR: Failed to start Docker container"
    exit 1
fi

log_message "OHIF Viewer is now running at port $PORT"
