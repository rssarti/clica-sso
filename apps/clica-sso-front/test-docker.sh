#!/bin/bash
# Build and Test Script for Clica SSO Frontend

echo "🚀 Building Clica SSO Frontend Docker Image..."

# Build the image
docker build -t clica-sso-front . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🧪 Testing health check..."
    
    # Run container in background
    CONTAINER_ID=$(docker run -d -p 3000:80 clica-sso-front)
    
    # Wait a bit for container to start
    sleep 5
    
    # Test health check
    if curl -f http://localhost:3000/health; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
    fi
    
    # Test main page
    if curl -f http://localhost:3000/; then
        echo "✅ Main page accessible!"
    else
        echo "❌ Main page failed!"
    fi
    
    echo "📋 Container logs:"
    docker logs $CONTAINER_ID
    
    # Cleanup
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    
    echo "🎉 Test completed!"
else
    echo "❌ Build failed!"
    exit 1
fi