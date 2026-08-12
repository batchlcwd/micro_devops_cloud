package com.substring.todo.services;

import com.substring.todo.models.Todo;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TodoService {

    // Thread-safe in-memory list to manage todos without database
    private final List<Todo> todoList = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void initDummyData() {
        if (todoList.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();

            todoList.add(new Todo(
                    UUID.randomUUID().toString(),
                    "Learn Docker & Containerization",
                    "Understand images, containers, volumes, and multi-stage builds",
                    true,
                    now.minusDays(3),
                    now.minusDays(2)
            ));

            todoList.add(new Todo(
                    UUID.randomUUID().toString(),
                    "Setup CI/CD Pipeline",
                    "Configure GitHub Actions workflow for automated testing and building",
                    false,
                    now.minusDays(2),
                    now.minusDays(2)
            ));

            todoList.add(new Todo(
                    UUID.randomUUID().toString(),
                    "Deploy to Kubernetes Cluster",
                    "Create Kubernetes Deployment and Service YAML manifests for microservices",
                    false,
                    now.minusDays(1),
                    now.minusDays(1)
            ));

            todoList.add(new Todo(
                    UUID.randomUUID().toString(),
                    "Implement Observability & Monitoring",
                    "Configure Prometheus metrics and Grafana dashboards for monitoring",
                    false,
                    now,
                    now
            ));
        }
    }

    // Create a new todo
    public Todo createTodo(Todo todo) {
        if (todo.getId() == null || todo.getId().trim().isEmpty()) {
            todo.setId(UUID.randomUUID().toString());
        }
        LocalDateTime now = LocalDateTime.now();
        if (todo.getCreatedAt() == null) {
            todo.setCreatedAt(now);
        }
        todo.setUpdatedAt(now);
        todoList.add(todo);
        return todo;
    }

    // Get all todos
    public List<Todo> getAllTodos() {
        return todoList;
    }

    // Get todo by ID
    public Optional<Todo> getTodoById(String id) {
        return todoList.stream()
                .filter(t -> t.getId().equalsIgnoreCase(id))
                .findFirst();
    }

    // Search todos by title or description
    public List<Todo> searchTodos(String query) {
        if (query == null || query.trim().isEmpty()) {
            return todoList;
        }
        String lowerQuery = query.toLowerCase().trim();
        return todoList.stream()
                .filter(t -> (t.getTitle() != null && t.getTitle().toLowerCase().contains(lowerQuery)) ||
                        (t.getDescription() != null && t.getDescription().toLowerCase().contains(lowerQuery)))
                .toList();
    }

    // Update existing todo
    public Optional<Todo> updateTodo(String id, Todo updatedTodo) {
        return getTodoById(id).map(existingTodo -> {
            if (updatedTodo.getTitle() != null) {
                existingTodo.setTitle(updatedTodo.getTitle());
            }
            if (updatedTodo.getDescription() != null) {
                existingTodo.setDescription(updatedTodo.getDescription());
            }
            existingTodo.setCompleted(updatedTodo.isCompleted());
            existingTodo.setUpdatedAt(LocalDateTime.now());
            return existingTodo;
        });
    }

    // Delete todo by ID
    public boolean deleteTodo(String id) {
        return todoList.removeIf(t -> t.getId().equalsIgnoreCase(id));
    }

    // Delete all todos
    public void deleteAllTodos() {
        todoList.clear();
    }
}
