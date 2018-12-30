package com.gmail.ivanjermakov1.messenger.messaging.controller;

import com.gmail.ivanjermakov1.messenger.auth.entity.User;
import com.gmail.ivanjermakov1.messenger.auth.service.UserService;
import com.gmail.ivanjermakov1.messenger.exception.AuthenticationException;
import com.gmail.ivanjermakov1.messenger.exception.InvalidMessageException;
import com.gmail.ivanjermakov1.messenger.exception.NoSuchEntityException;
import com.gmail.ivanjermakov1.messenger.messaging.dto.MessageDTO;
import com.gmail.ivanjermakov1.messenger.messaging.dto.action.ConversationReadAction;
import com.gmail.ivanjermakov1.messenger.messaging.dto.action.MessageEditAction;
import com.gmail.ivanjermakov1.messenger.messaging.dto.action.NewMessageAction;
import com.gmail.ivanjermakov1.messenger.messaging.dto.action.Request;
import com.gmail.ivanjermakov1.messenger.messaging.entity.Message;
import com.gmail.ivanjermakov1.messenger.messaging.service.MessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

@RestController
@RequestMapping("messaging")
public class MessagingController {
	
	private final MessagingService messagingService;
	private final UserService userService;
	
	@Autowired
	public MessagingController(MessagingService messagingService, UserService userService) {
		this.messagingService = messagingService;
		this.userService = userService;
	}
	
	@RequestMapping("get/m")
	@GetMapping
	public DeferredResult<NewMessageAction> getMessage(@RequestHeader("Auth-Token") String token) throws AuthenticationException {
		User user = userService.authenticate(token);
		
		DeferredResult<NewMessageAction> request = new DeferredResult<>();
		request.onTimeout(() -> messagingService.getNewMessageRequests().removeIf(r -> r.getDeferredResult().equals(request)));
		messagingService.getNewMessageRequests().add(new Request<>(user, request));
		
		return request;
	}
	
	@RequestMapping("get/r")
	@GetMapping
	public DeferredResult<ConversationReadAction> getRead(@RequestHeader("Auth-Token") String token) throws AuthenticationException {
		User user = userService.authenticate(token);
		
		DeferredResult<ConversationReadAction> request = new DeferredResult<>();
		request.onTimeout(() -> messagingService.getConversationReadRequests().removeIf(r -> r.getDeferredResult().equals(request)));
		messagingService.getConversationReadRequests().add(new Request<>(user, request));
		
		return request;
	}
	
	@RequestMapping("get/e")
	@GetMapping
	public DeferredResult<MessageEditAction> getEdit(@RequestHeader("Auth-Token") String token) throws AuthenticationException {
		User user = userService.authenticate(token);
		
		DeferredResult<MessageEditAction> request = new DeferredResult<>();
		request.onTimeout(() -> messagingService.getMessageEditRequests().removeIf(r -> r.getDeferredResult().equals(request)));
		messagingService.getMessageEditRequests().add(new Request<>(user, request));
		
		return request;
	}
	
	@RequestMapping("send")
	@PostMapping
	public MessageDTO sendMessage(@RequestHeader("Auth-Token") String token, @RequestBody Message message) throws AuthenticationException, InvalidMessageException, NoSuchEntityException {
		if (message.validate()) throw new InvalidMessageException("invalid message");
		
		User user = userService.authenticate(token);
		messagingService.processConversationRead(user, message.getConversationId());
		return messagingService.processNewMessage(user, message);
	}
	
	@RequestMapping("edit")
	@PostMapping
	public void editMessage(@RequestHeader("Auth-Token") String token, @RequestBody Message message) throws AuthenticationException, InvalidMessageException, NoSuchEntityException {
		if (message.getText() == null || message.getConversationId() == null)
			throw new InvalidMessageException("invalid message");
		
		User user = userService.authenticate(token);
		
		if (!message.getSenderId().equals(user.getId()))
			throw new AuthenticationException("user can edit only own messages");
		
		messagingService.processMessageEdit(user, message);
	}
	
}
