### How to start mysql container

```bash

docker run -d --rm --name mysql_container -p 3309:3306 -v my_db_data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root mysql:latest

```

Problem with this command : Whenever container is removed data is also removed.

### Solution of this problem is **Docker Volumes**

Data ko container ke bahar store karna.

### Started Java app with volume

```bash
docker run -d --rm  --name java_app -p 8080:8080 -v ./logs:/app/logs --network spring-network javaapp_test:1.0

```
