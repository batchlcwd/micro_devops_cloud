

#-----state1--building stage
FROM eclipse-temurin:21.0.8_9-jdk-jammy AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY ./src ./src
RUN ./mvnw clean install -DskipTests


#-----stage2--run stage

FROM eclipse-temurin:25-jre As final

WORKDIR /app

COPY  --from=builder /app/target/*.jar /app/app.jar

EXPOSE 8080

CMD ["java","-jar","app.jar"]

#ENTRYPOINT ["java","-jar","app.jar"]