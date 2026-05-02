## Command to start postgres
```bash

docker run -d --name postgres-db -e POSTGRES_DB=productdb -e POSTGRES_USER=user -e POSTGRES_PASSWORD=user -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:16


```