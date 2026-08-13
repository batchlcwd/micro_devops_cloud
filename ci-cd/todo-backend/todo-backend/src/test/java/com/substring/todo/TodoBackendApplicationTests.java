package com.substring.todo;

import com.substring.todo.controllers.HomeController;
import com.substring.todo.controllers.TodoController;
import com.substring.todo.models.Todo;
import com.substring.todo.services.TodoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TodoBackendApplicationTests {

	@Autowired
	private HomeController homeController;

	@Autowired
	private TodoController todoController;

	@Autowired
	private TodoService todoService;

	@BeforeEach
	void setUp() {
		todoService.deleteAllTodos();
	}

	@Test
	void contextLoads() {
		assertNotNull(homeController);
		assertNotNull(todoController);
		assertNotNull(todoService);
	}

	@Test
	void testRootEndpoint() {
		String viewName = homeController.index();
		assertEquals("index", viewName);

		ResponseEntity<Map<String, Object>> response = homeController.status();
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("OK", response.getBody().get("status"));
		assertEquals("Todo Backend API is running successfully", response.getBody().get("message"));
		assertEquals("todo-backend", response.getBody().get("service"));
	}

	@Test
	void testDummyDataInitialization() {
		todoService.initDummyData();
		List<Todo> todos = todoService.getAllTodos();
		assertFalse(todos.isEmpty());
		assertEquals(4, todos.size());
	}

	@Test
	void testCreateAndGetTodo() {
		Todo todo = new Todo();
		todo.setTitle("Learn DevOps");
		todo.setDescription("Complete CI/CD pipelines");
		todo.setCompleted(false);

		ResponseEntity<Todo> response = todoController.createTodo(todo);
		assertEquals(HttpStatus.CREATED, response.getStatusCode());
		assertNotNull(response.getBody());
		assertNotNull(response.getBody().getId());
		assertEquals("Learn DevOps", response.getBody().getTitle());
		assertEquals("Complete CI/CD pipelines", response.getBody().getDescription());
		assertFalse(response.getBody().isCompleted());
		assertNotNull(response.getBody().getCreatedAt());

		ResponseEntity<List<Todo>> allTodosResponse = todoController.getAllTodos();
		assertEquals(HttpStatus.OK, allTodosResponse.getStatusCode());
		assertEquals(1, allTodosResponse.getBody().size());

		String todoId = response.getBody().getId();
		ResponseEntity<Todo> getByIdResponse = todoController.getTodoById(todoId);
		assertEquals(HttpStatus.OK, getByIdResponse.getStatusCode());
		assertEquals("Learn DevOps", getByIdResponse.getBody().getTitle());
	}

	@Test
	void testSearchTodos() {
		Todo t1 = new Todo();
		t1.setTitle("Learn Kubernetes");
		t1.setDescription("Understand pods and services");
		todoService.createTodo(t1);

		Todo t2 = new Todo();
		t2.setTitle("Learn Docker");
		t2.setDescription("Understand images and containers");
		todoService.createTodo(t2);

		ResponseEntity<List<Todo>> searchResponse = todoController.searchTodos("Kubernetes");
		assertEquals(HttpStatus.OK, searchResponse.getStatusCode());
		assertNotNull(searchResponse.getBody());
		assertEquals(1, searchResponse.getBody().size());
		assertEquals("Learn Kubernetes", searchResponse.getBody().get(0).getTitle());

		ResponseEntity<List<Todo>> searchByDesc = todoController.searchTodos("containers");
		assertEquals(HttpStatus.OK, searchByDesc.getStatusCode());
		assertNotNull(searchByDesc.getBody());
		assertEquals(1, searchByDesc.getBody().size());
		assertEquals("Learn Docker", searchByDesc.getBody().get(0).getTitle());
	}

	@Test
	void testUpdateTodo() {
		Todo todo = new Todo();
		todo.setTitle("Task 1");
		todo.setDescription("Description 1");
		Todo created = todoService.createTodo(todo);

		Todo updatePayload = new Todo();
		updatePayload.setTitle("Updated Task 1");
		updatePayload.setDescription("Updated Description 1");
		updatePayload.setCompleted(true);

		ResponseEntity<Todo> updateResponse = todoController.updateTodo(created.getId(), updatePayload);
		assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
		assertNotNull(updateResponse.getBody());
		assertEquals("Updated Task 1", updateResponse.getBody().getTitle());
		assertEquals("Updated Description 1", updateResponse.getBody().getDescription());
		assertTrue(updateResponse.getBody().isCompleted());
	}

	@Test
	void testDeleteTodo() {
		Todo todo = new Todo();
		todo.setTitle("Task to delete");
		Todo created = todoService.createTodo(todo);

		ResponseEntity<Void> deleteResponse = todoController.deleteTodo(created.getId());
		assertEquals(HttpStatus.NO_CONTENT, deleteResponse.getStatusCode());

		ResponseEntity<Todo> getResponse = todoController.getTodoById(created.getId());
		assertEquals(HttpStatus.NOT_FOUND, getResponse.getStatusCode());
	}

	@Test
	void testGetNonExistentTodo() {
		ResponseEntity<Todo> response = todoController.getTodoById("non-existent-id");
		assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
	}
}
