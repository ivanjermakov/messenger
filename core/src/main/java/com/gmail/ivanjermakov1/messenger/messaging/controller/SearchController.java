package com.gmail.ivanjermakov1.messenger.messaging.controller;

import com.gmail.ivanjermakov1.messenger.auth.dto.UserDto;
import com.gmail.ivanjermakov1.messenger.auth.entity.User;
import com.gmail.ivanjermakov1.messenger.auth.service.UserService;
import com.gmail.ivanjermakov1.messenger.exception.AuthenticationException;
import com.gmail.ivanjermakov1.messenger.exception.InvalidSearchFormatException;
import com.gmail.ivanjermakov1.messenger.messaging.dto.PreviewDto;
import com.gmail.ivanjermakov1.messenger.messaging.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("search")
public class SearchController {
	
	private final SearchService searchService;
	private final UserService userService;
	
	@Autowired
	public SearchController(SearchService searchService, UserService userService) {
		this.searchService = searchService;
		this.userService = userService;
	}
	
	/**
	 * TODO: describe search algorithm more detailed
	 * Find preview by companion first or last name
	 *
	 * @param token  user token
	 * @param search search query
	 * @return list of found previews
	 * @throws AuthenticationException on invalid @param token
	 */
	@GetMapping("conversations")
	public List<PreviewDto> searchConversations(@RequestHeader("Auth-Token") String token,
	                                            @RequestParam("search") String search) throws AuthenticationException {
		User user = userService.authenticate(token);
		return searchService.searchConversations(user, search);
	}
	
	/**
	 * Find users by their login.
	 * Search @param search should start with '@' otherwise {@code InvalidSearchFormatException} will be thrown.
	 * Amount of results is limited by @value {@code search.result.limit}
	 *
	 * @param token  user token
	 * @param search search query
	 * @return list of found users
	 * @throws AuthenticationException      on invalid @param token
	 * @throws InvalidSearchFormatException on invalid @param query
	 */
	@GetMapping("users")
	public List<UserDto> searchUsers(@RequestHeader("Auth-Token") String token,
	                                 @RequestParam("search") String search) throws AuthenticationException, InvalidSearchFormatException {
		userService.authenticate(token);
		return searchService.searchUsers(search);
	}
	
}