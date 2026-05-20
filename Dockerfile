FROM eclipse-temurin:17

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/reservas-app-0.0.1-SNAPSHOT.jar"]