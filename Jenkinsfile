pipeline {
    agent any
    
    parameters {
        choice(
            name: 'ACTION',
            choices: [
                'Deploy (Normal)',
                'Deploy + Seed Database',
                'Seed Database Only',
                'Migration Only'
            ],
            description: 'Selecione a ação a ser executada no pipeline'
        )
    }
    
    environment {
        // Docker Registry - Using DockerHub
        DOCKER_REGISTRY = 'docker.io/sispsolutions'
        DOCKER_CREDENTIALS_ID = 'dockerhub'
        
        // Kubernetes Configuration
        NAMESPACE = 'clica-sso'
        KUBE_CREDENTIALS_ID = 'jenkins-deployer-token'
        
        // Environment file - Single .env file with all secrets
        ENV_FILE = credentials('clica-sso-env-file')
        
        // Git commit hash for image tagging
        GIT_COMMIT_SHORT = sh(
            script: "git rev-parse --short HEAD",
            returnStdout: true
        ).trim()
        
        // Image names
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/clica-sso-backend:${GIT_COMMIT_SHORT}"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/clica-sso-frontend:${GIT_COMMIT_SHORT}"
        WEBSOCKET_IMAGE = "${DOCKER_REGISTRY}/clica-sso-websocket:${GIT_COMMIT_SHORT}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Selected action: ${params.ACTION}"
                echo "Git Commit: ${GIT_COMMIT_SHORT}"
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            when {
                expression { 
                    params.ACTION == 'Deploy (Normal)' || 
                    params.ACTION == 'Deploy + Seed Database' ||
                    params.ACTION == 'Migration Only'
                }
            }
            steps {
                echo 'Installing dependencies...'
                sh '''
                    set -e
                    
                    # Load nvm if already installed but not in PATH
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    
                    # Install Node.js via nvm if npm is not available
                    if ! command -v npm > /dev/null 2>&1; then
                        echo "npm not found — installing Node.js 20 via nvm..."
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                        export NVM_DIR="$HOME/.nvm"
                        . "$NVM_DIR/nvm.sh"
                        nvm install 20
                        nvm alias default 20
                        nvm use default
                    fi
                    
                    echo "✓ Node.js $(node -v) / npm $(npm -v) available"
                    
                    # Install pnpm if not available
                    if ! command -v pnpm > /dev/null 2>&1; then
                        npm install -g pnpm
                    fi
                    
                    echo "✓ pnpm $(pnpm -v) available"
                    
                    # Install project dependencies
                    echo "Installing dependencies with pnpm..."
                    pnpm install
                '''
            }
        }
        
        stage('Build Applications') {
            when {
                not {
                    expression { params.ACTION ==~ /.*Only/ }
                }
            }
            parallel {
                stage('Build Backend') {
                    steps {
                        echo 'Building backend...'
                        dir('apps/clica-sso-backend') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                pnpm run build
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        echo 'Building frontend...'
                        dir('apps/clica-sso-front') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                pnpm run build
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            when {
                not {
                    expression { params.ACTION ==~ /.*Only/ }
                }
            }
            parallel {
                stage('Backend Image') {
                    steps {
                        echo "Building backend Docker image: ${BACKEND_IMAGE}"
                        sh """
                            docker build -t ${BACKEND_IMAGE} apps/clica-sso-backend/
                            docker tag ${BACKEND_IMAGE} ${DOCKER_REGISTRY}/clica-sso-backend:latest
                        """
                    }
                }
                
                stage('Frontend Image') {
                    steps {
                        echo "Building frontend Docker image: ${FRONTEND_IMAGE}"
                        sh """
                            docker build \\
                                --build-arg VITE_API_URL=https://api.clicatecnologia.com.br \\
                                --build-arg VITE_SOCKET_IO=wss://ws.clicatecnologia.com.br \\
                                --build-arg VITE_SOCKET_PATCH=/socket.io/ \\
                                -t ${FRONTEND_IMAGE} \\
                                apps/clica-sso-front/
                            docker tag ${FRONTEND_IMAGE} ${DOCKER_REGISTRY}/clica-sso-frontend:latest
                        """
                    }
                }
                
                stage('WebSocket Image') {
                    steps {
                        echo "Building WebSocket Docker image: ${WEBSOCKET_IMAGE}"
                        sh """
                            docker build -t ${WEBSOCKET_IMAGE} apps/clica-sso-backend/
                            docker tag ${WEBSOCKET_IMAGE} ${DOCKER_REGISTRY}/clica-sso-websocket:latest
                        """
                    }
                }
            }
        }
        
        stage('Push Docker Images') {
            when {
                not {
                    expression { params.ACTION ==~ /.*Only/ }
                }
            }
            steps {
                echo 'Pushing Docker images to DockerHub...'
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo "\${DOCKER_PASS}" | docker login -u "\${DOCKER_USER}" --password-stdin
                            
                            docker push ${BACKEND_IMAGE}
                            docker push ${DOCKER_REGISTRY}/clica-sso-backend:latest
                            
                            docker push ${FRONTEND_IMAGE}
                            docker push ${DOCKER_REGISTRY}/clica-sso-frontend:latest
                            
                            docker push ${WEBSOCKET_IMAGE}
                            docker push ${DOCKER_REGISTRY}/clica-sso-websocket:latest
                            
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Update Kubernetes Secrets') {
            when {
                not {
                    expression { params.ACTION ==~ /.*Only/ }
                }
            }
            steps {
                echo 'Updating Kubernetes secrets from .env file...'
                withCredentials([string(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBE_TOKEN')]) {
                    sh """
                        # Use temporary kubeconfig to avoid permission issues
                        export KUBECONFIG=/tmp/kubeconfig-\${BUILD_ID}
                        K3S_SERVER=\${K3S_SERVER:-https://127.0.0.1:6443}
                        
                        # Configure kubectl
                        kubectl config set-cluster k3s --server=\${K3S_SERVER} --insecure-skip-tls-verify=true
                        kubectl config set-credentials jenkins-deployer --token=\${KUBE_TOKEN}
                        kubectl config set-context k3s --cluster=k3s --user=jenkins-deployer --namespace=${NAMESPACE}
                        kubectl config use-context k3s
                        
                        # Create secret from .env file
                        kubectl create secret generic clica-sso-secrets \\
                            --from-env-file=${ENV_FILE} \\
                            --namespace=${NAMESPACE} \\
                            --dry-run=client -o yaml | kubectl apply -f -
                        
                        # Cleanup temporary kubeconfig
                        rm -f /tmp/kubeconfig-\${BUILD_ID}
                    """
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                not {
                    expression { params.ACTION ==~ /.*Only/ }
                }
            }
            steps {
                echo 'Deploying to Kubernetes...'
                withCredentials([string(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBE_TOKEN')]) {
                    sh """
                        # Use temporary kubeconfig to avoid permission issues
                        export KUBECONFIG=/tmp/kubeconfig-\${BUILD_ID}
                        K3S_SERVER=\${K3S_SERVER:-https://127.0.0.1:6443}
                        
                        # Configure kubectl
                        kubectl config set-cluster k3s --server=\${K3S_SERVER} --insecure-skip-tls-verify=true
                        kubectl config set-credentials jenkins-deployer --token=\${KUBE_TOKEN}
                        kubectl config set-context k3s --cluster=k3s --user=jenkins-deployer --namespace=${NAMESPACE}
                        kubectl config use-context k3s
                        
                        # Apply namespace and configmap
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/configmap.yaml
                        kubectl apply -f k8s/service-account.yaml
                        
                        # Apply deployments
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/websocket-deployment.yaml
                        
                        # Apply ingress and SSL issuer
                        kubectl apply -f k8s/ingress.yaml
                        kubectl apply -f k8s/letsencrypt-issuer.yaml
                        
                        # Wait for deployment to be ready
                        echo "Waiting for deployments to rollout..."
                        kubectl rollout status deployment/clica-sso-backend -n ${NAMESPACE} --timeout=5m
                        kubectl rollout status deployment/clica-sso-frontend -n ${NAMESPACE} --timeout=5m
                        kubectl rollout status deployment/clica-sso-websocket -n ${NAMESPACE} --timeout=5m
                        
                        # Cleanup temporary kubeconfig
                        rm -f /tmp/kubeconfig-\${BUILD_ID}
                    """
                }
            }
        }
        
        stage('Database Migration') {
            when {
                expression { 
                    params.ACTION == 'Deploy + Seed Database' ||
                    params.ACTION == 'Migration Only'
                }
            }
            steps {
                echo 'Running database migrations...'
                withCredentials([string(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBE_TOKEN')]) {
                    sh """
                        # Use temporary kubeconfig
                        export KUBECONFIG=/tmp/kubeconfig-\${BUILD_ID}
                        K3S_SERVER=\${K3S_SERVER:-https://127.0.0.1:6443}
                        
                        # Configure kubectl
                        kubectl config set-cluster k3s --server=\${K3S_SERVER} --insecure-skip-tls-verify=true
                        kubectl config set-credentials jenkins-deployer --token=\${KUBE_TOKEN}
                        kubectl config set-context k3s --cluster=k3s --user=jenkins-deployer --namespace=${NAMESPACE}
                        kubectl config use-context k3s
                        
                        # Run migration job
                        echo "Running TypeORM migrations..."
                        kubectl exec -it \$(kubectl get pod -n ${NAMESPACE} -l app=clica-sso-backend -o jsonpath='{.items[0].metadata.name}') -n ${NAMESPACE} -- pnpm run migration:run
                        
                        # Cleanup temporary kubeconfig
                        rm -f /tmp/kubeconfig-\${BUILD_ID}
                    """
                }
            }
        }
        
        stage('Seed Database') {
            when {
                expression { 
                    params.ACTION == 'Deploy + Seed Database'
                }
            }
            steps {
                echo 'Seeding database...'
                withCredentials([string(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBE_TOKEN')]) {
                    sh """
                        # Use temporary kubeconfig
                        export KUBECONFIG=/tmp/kubeconfig-\${BUILD_ID}
                        K3S_SERVER=\${K3S_SERVER:-https://127.0.0.1:6443}
                        
                        # Configure kubectl
                        kubectl config set-cluster k3s --server=\${K3S_SERVER} --insecure-skip-tls-verify=true
                        kubectl config set-credentials jenkins-deployer --token=\${KUBE_TOKEN}
                        kubectl config set-context k3s --cluster=k3s --user=jenkins-deployer --namespace=${NAMESPACE}
                        kubectl config use-context k3s
                        
                        # Run seed job
                        echo "Running database seed..."
                        kubectl exec -it \$(kubectl get pod -n ${NAMESPACE} -l app=clica-sso-backend -o jsonpath='{.items[0].metadata.name}') -n ${NAMESPACE} -- pnpm run seed
                        
                        # Cleanup temporary kubeconfig
                        rm -f /tmp/kubeconfig-\${BUILD_ID}
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            // Add notification here (Slack, email, etc.)
        }
        failure {
            echo '❌ Pipeline failed!'
            // Add notification here (Slack, email, etc.)
        }
        always {
            // Cleanup
            sh 'rm -f /tmp/kubeconfig-${BUILD_ID} || true'
        }
    }
}
