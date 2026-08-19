pipeline {
agent any 

environment{
    PROJECT_NAME="todo-backend"
    DOCKER_IMAGE="batchlcwd/simple-todo-backend"
    DOCKER_TAG="${BUILD_NUMBER}"
    EC2_HOST="3.108.246.136"
    EC2_USER="ubuntu"
    DOCKER_CONTAINER="todo-backend"
    APP_PORT="8082:8080"
}

stages{

stage("Checkout"){

        steps{
            checkout scm 
            echo "checkout successful"
            echo "Testing from github..."
        }

}

stage("Test"){

steps{
    sh '''
    chmod +x ./mvnw
    ./mvnw test

    '''
}

}


stage("Build"){

steps{
    sh '''
    
    ./mvnw clean package -DskipTests

    '''
}

}



stage("Docker Build"){

steps{
    sh '''
   

    docker build \
    -t ${DOCKER_IMAGE}:${DOCKER_TAG} .

    
    

    '''
}
}



stage("Docker Push"){

steps{
 
    withCredentials([
        usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DOCKERHUB_USERNAME',
            passwordVariable: 'DOCKERHUB_PASSWORD'
        )
    ])
    {

        sh '''      

            echo "$DOCKERHUB_PASSWORD" | docker login \
            -u $DOCKERHUB_USERNAME \
            --password-stdin

            docker push ${DOCKER_IMAGE}:${DOCKER_TAG}

            docker image prune -af 
            
            docker images

        '''

    }

}



}


stage("EC2 Deploy- staging server"){

steps{

        sh '''

            echo "Deployed to staging server"

        '''

}
}

stage("Production Approval "){

steps{
    input message: 'Deploy to production?'
}

}


stage("EC2 Deploy- production server")
{

steps{

    sshagent([
        'ec2-instance-key'
    ]){



         



            // code goes here
          sh '''
            mkdir -p ~/.ssh
            chmod 700 ~/.ssh
            ssh-keyscan -H "$EC2_HOST" >> ~/.ssh/known_hosts

            ssh $EC2_USER@$EC2_HOST "
                docker rm -f $DOCKER_CONTAINER || true

                docker pull $DOCKER_IMAGE:$DOCKER_TAG

                docker run -d \
                    --name $DOCKER_CONTAINER \
                    -p $APP_PORT \
                    --restart unless-stopped \
                    $DOCKER_IMAGE:$DOCKER_TAG

                docker image prune -f
            "
'''


    }


}

}




}


}