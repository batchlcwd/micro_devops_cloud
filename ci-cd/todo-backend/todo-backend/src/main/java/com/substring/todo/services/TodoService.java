package com.substring.todo.services;

import com.substring.todo.models.Todo;
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

    // Create a new todo
    public Todo createTodo(Todo todo) {
        if (todo.getId() == null || todo.getId().trim().isEmpty()) {
            todo.setId(UUID.randomUUID().toString());
        }
        LocalDateTime now = LocalDateTime.now();
        todo.setCreatedAt(now);
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
