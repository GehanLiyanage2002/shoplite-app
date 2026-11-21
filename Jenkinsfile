pipeline {
    agent any

    environment {
        ACR_SERVER   = 'shopliteacr2026.azurecr.io'
        IMAGE_NAME   = 'shoplite-api'
        IMAGE_TAG    = "${env.GIT_COMMIT.take(7)}"
        FULL_IMAGE   = "${ACR_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"
        GITOPS_REPO  = 'github.com/<your-username>/shoplite-gitops-infra.git'
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('3. Lint Check') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('4. Unit Tests & Coverage') {
            steps {
                sh 'npm test'
            }
        }

        stage('5. SonarQube Analysis & Quality Gate') {
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh 'sonar-scanner'
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('6. Filesystem Security Scan (Trivy)') {
            steps {
                sh 'trivy fs --exit-code 1 --severity HIGH,CRITICAL --no-progress .'
            }
        }

        stage('7. Docker Build & Container Scan') {
            steps {
                sh "docker build -t ${FULL_IMAGE} ."
                sh "trivy image --exit-code 1 --severity HIGH,CRITICAL --no-progress ${FULL_IMAGE}"
            }
        }

        stage('8. Push Image to ACR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-sp-creds', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    sh """
                        echo \$ACR_PASS | docker login ${ACR_SERVER} -u \$ACR_USER --password-stdin
                        docker push ${FULL_IMAGE}
                        docker logout ${ACR_SERVER}
                    """
                }
            }
        }

        stage('9. Update GitOps Manifest (Trigger ArgoCD)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-pat', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh """
                        rm -rf gitops-tmp
                        git clone https://\${GIT_USER}:\${GIT_TOKEN}@${GITOPS_REPO} gitops-tmp
                        cd gitops-tmp
                        sed -i "s|image: ${ACR_SERVER}/${IMAGE_NAME}:.*|image: ${FULL_IMAGE}|g" k8s/apps/rollout.yaml
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@shoplite.local"
                        git add k8s/apps/rollout.yaml
                        git commit -m "ci: bump shoplite-api image to ${IMAGE_TAG}" || exit 0
                        git push origin main
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${FULL_IMAGE} || true"
            cleanWs()
        }
    }
}