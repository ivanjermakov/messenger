package com.gmail.ivanjermakov1.messenger.messaging;

import com.gmail.ivanjermakov1.messenger.SpringBootConfig;
import com.gmail.ivanjermakov1.messenger.auth.dto.RegisterUserDTO;
import com.gmail.ivanjermakov1.messenger.auth.dto.UserDTO;
import com.gmail.ivanjermakov1.messenger.auth.service.UserService;
import com.gmail.ivanjermakov1.messenger.exception.AuthenticationException;
import com.gmail.ivanjermakov1.messenger.exception.InvalidMessageException;
import com.gmail.ivanjermakov1.messenger.exception.NoSuchEntityException;
import com.gmail.ivanjermakov1.messenger.exception.RegistrationException;
import com.gmail.ivanjermakov1.messenger.messaging.controller.ConversationController;
import com.gmail.ivanjermakov1.messenger.messaging.controller.MessagingController;
import com.gmail.ivanjermakov1.messenger.messaging.dto.action.NewMessageAction;
import com.gmail.ivanjermakov1.messenger.messaging.entity.Conversation;
import com.gmail.ivanjermakov1.messenger.messaging.entity.Message;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.ConfigFileApplicationContextInitializer;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.context.request.async.DeferredResult;

import javax.transaction.Transactional;
import java.time.Instant;
import java.util.Collections;

@RunWith(SpringRunner.class)
@ContextConfiguration(classes = SpringBootConfig.class,
		initializers = ConfigFileApplicationContextInitializer.class)
@Transactional
public class MessagingIntegrationTest {
	
	@Autowired
	private MessagingController messagingController;
	
	@Autowired
	private ConversationController conversationController;
	
	@Autowired
	private UserService userService;
	
	@Test
	public void shouldSendAndReceiveMessage() throws RegistrationException, AuthenticationException, NoSuchEntityException, InvalidMessageException {
		userService.register(new RegisterUserDTO("Jack", "Johnson", "jackj", "password1"));
		String user1Token = userService.authenticate("jackj", "password1");
		UserDTO user1 = userService.full(userService.authenticate(user1Token));
		
		userService.register(new RegisterUserDTO("Ron", "Richardson", "ronr", "password1"));
		String user2Token = userService.authenticate("ronr", "password1");
		UserDTO user2 = userService.full(userService.authenticate(user2Token));
		
		Assert.assertNotNull(user1);
		Assert.assertNotNull(user2);
		
		Conversation conversation = conversationController.create(user1Token, user2.getUser().getLogin());
		
		Assert.assertNotNull(conversation);
		
		Message message = new Message(
				conversation.getId(),
				Instant.now(),
				"Hello!",
				false,
				user1.getUser().getId(),
				Collections.emptyList()
		);
		
		DeferredResult<NewMessageAction> deferredResult = messagingController.getMessage(user2Token);
		deferredResult.onCompletion(() -> {
			NewMessageAction action = (NewMessageAction) deferredResult.getResult();
			Assert.assertNotNull(action);
			
			Assert.assertEquals(action.getMessage().getMessage(), message);
		});
		
		messagingController.sendMessage(user1Token, message);
	}
	
}
