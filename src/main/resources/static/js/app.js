const MESSAGES_PER_PAGE = 20;

let app = angular.module("app", []);

app.directive('myEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown", function (event) {
			if (event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.myEnter);
				});

				event.preventDefault();
			}
		});
	};
});

app.controller('MainController', ($document, $scope, $http) => {

	$scope.ME = null;
	$scope.FULL_MESSAGE = null;

	$scope.token = null;
	$scope.credentials = {
		"login": null,
		"password": null,
		"confirmPassword": null,
		"firstName": null,
		"lastName": null
	};

	$scope.previews = [];
	$scope.messages = [];

	$scope.searchConversations = [];
	$scope.searchUsers = [];

	$scope.currentConversationId = null;
	$scope.currentConversationWith = null;

	$scope.isLoaded = false;

	$scope.isAuth = true;
	$scope.isLogin = true;

	$scope.isSearch = false;
	$scope.isUserSearch = false;

	$scope.searchText = null;

	// out - outside certain conversation
	// in - in certain conversation
	// empty - in empty conversation
	$scope.state = "out";

	$scope.messageText = null;

	$scope.listen = false;

	$scope.isLeftView = true;

	$document.bind('keydown', (e) => {
		if (e.keyCode === 27) {
			$scope.state = "out";
			$scope.currentConversationId = null;
			$scope.isLeftView = true;

			$scope.$apply();
		}
	});

	// init
	(() => {
		// autologin
		if (localStorage.getItem("token")) {
			let token = localStorage.getItem("token");

			$http({
				url: "/auth/validate",
				method: "GET",
				params: {
					"token": token
				},
			}).then(
				(response) => {
					$scope.credentials.login = response.data.login;

					$scope.token = token;
					$scope.initialize();
					$scope.updatePreviews();
					$scope.isAuth = false;

					$scope.listen = true;
					$scope.getMessages();

					$scope.isLoaded = true;
				},
				(error) => {
					$scope.isLoaded = true;
				});
		} else {
			$scope.isLoaded = true;
		}

		$http({
			url: "/message/init/full",
			method: "GET"
		}).then((response) => {
			$scope.FULL_MESSAGE = response.data;
		});
	})();

	$scope.login = () => {
		$http({
			url: "/auth",
			method: "GET",
			params: {
				"login": $scope.credentials.login,
				"password": $scope.credentials.password
			},
			transformResponse: undefined
		}).then((response) => {
			// storing password is bad habit!
			$scope.credentials.password = null;

			$scope.token = response.data;
			localStorage.setItem("token", $scope.token);
			$scope.initialize();
			$scope.updatePreviews();

			$scope.listen = true;
			$scope.getMessages();

			$scope.isAuth = false;
		});
	};

	$scope.register = () => {
		if ($scope.credentials.password === $scope.credentials.confirmPassword) {
			$http({
				url: "/register",
				method: "GET",
				params: {
					"firstName": $scope.credentials.firstName,
					"lastName": $scope.credentials.lastName,
					"login": $scope.credentials.login,
					"password": $scope.credentials.password
				},
			}).then((response) => {
				$scope.isLogin = true;
			});
		}
	};

	$scope.initialize = () => {
		$http({
			url: "/auth/validate",
			method: "GET",
			params: {
				"token": $scope.token
			}
		}).then((response) => {
			$scope.ME = response.data;
		});

		$scope.updatePreviews();
	};

	$scope.updatePreviews = () => {
		$http({
			url: "/preview/all",
			method: "GET",
			params: {
				"token": $scope.token
			}
		}).then((response) => {
			response.data = response.data.filter((p) => p.lastMessage != null);

			console.log(response.data);
			response.data.sort((a, b) => moment(a.lastMessage.message.sent).isAfter(b.lastMessage.message.sent) ? -1 : 1);

			for (let preview of response.data) {
				if (preview.lastMessage)
					preview.lastMessage.message.sent = moment(preview.lastMessage.message.sent).format("H:mm");
			}
			$scope.previews = response.data;
		});
	};

	$scope.openConversation = (preview) => {
		$scope.searchText = "";
		$scope.isSearch = false;
		$scope.isLeftView = false;

		$http({
			url: "/message/get",
			method: "GET",
			params: {
				"token": $scope.token,
				"conversationId": preview.conversation.id,
				"offset": 0,
				"amount": MESSAGES_PER_PAGE
			}
		}).then((response) => {
			$scope.currentConversationId = preview.conversation.id;

			for (let message of response.data) {
				message.message.sent = moment(message.message.sent).format("H:mm");

				message.mine = $scope.ME.user.login === message.sender.user.login;
				message.status = "received";
			}
			$scope.messages = response.data;

			if ($scope.messages.length === 0) {
				$scope.state = "empty";
			} else {
				$scope.state = "in";
			}

			$scope.currentConversationWith = preview.with;
		});
	};

	$scope.conversationsOrSearch = () => {
		if ($scope.isSearch) {
			if ($scope.searchText[0] === '@') return $scope.searchUsers;
			return $scope.searchConversations;
		} else {
			return $scope.previews;
		}
	};

	$scope.searchForConversations = () => {
		$scope.isSearch = $scope.searchText.length !== 0;

		if (!$scope.isSearch) {
			$scope.isUserSearch = false;
			return;
		}

		if ($scope.searchText[0] === '@') {
			$scope.isUserSearch = true;
			$http({
				url: "/search/users",
				method: "GET",
				params: {
					"token": $scope.token,
					"search": $scope.searchText
				}
			}).then((response) => {
				$scope.searchUsers = response.data;
			});
		} else {
			$scope.isUserSearch = false;
			$http({
				url: "/search/conversations",
				method: "GET",
				params: {
					"token": $scope.token,
					"search": $scope.searchText
				}
			}).then((response) => {
				for (let preview of response.data) {
					if (preview.lastMessage)
						preview.lastMessage.message.sent = moment(preview.lastMessage.message.sent).format("H:mm");
				}
				$scope.searchConversations = response.data;
			});
		}
	};

	$scope.createConversation = (user) => {
		$http({
			url: "/conversation/create",
			method: "GET",
			params: {
				"token": $scope.token,
				"with": user.user.login
			}
		}).then((response) => {
			$scope.searchText = "";
			$scope.isUserSearch = false;
			$scope.isSearch = false;

			let conversation = response.data;

			$scope.updatePreviews();

			$http({
				url: "/preview/get",
				method: "GET",
				params: {
					"token": $scope.token,
					"conversationId": conversation.id
				}
			}).then((response) => {
				$scope.openConversation(response.data);
			});
		});
	};

	$scope.sendMessage = () => {
		if ($scope.messageText.replace(/\s/g, '').length === 0) return;

		let messageText = $scope.messageText;
		$scope.messageText = "";

		let message = $scope.FULL_MESSAGE;
		console.log(message);
		message.conversation.id = $scope.currentConversationId;
		message.message.conversationId = $scope.currentConversationId;
		message.message.text = messageText;
		message.sender = $scope.ME;
		message.mine = true;
		message.status = "sending";

		$scope.messages.unshift(message);

		let preview = $scope.previews.find(c => c.conversation.id === message.conversation.id);
		if (preview != null) preview.lastMessage = message;

		$http({
			url: "/messaging/send",
			method: "POST",
			data: message.message,
			params: {
				"token": $scope.token
			}
		}).then((response) => {
			$scope.messages = $scope.messages.filter(m => m !== message);
			$scope.updatePreviews();
		});
	};

	$scope.enterMessage = (e) => {
		if (e.which === 13 && !e.ctrlKey) {
			$scope.sendMessage();
		}
	};

	$scope.getMessages = () => {
		if ($scope.listen) {
			$http({
				url: "/messaging/get",
				method: "GET",
				params: {
					"token": $scope.token
				}
			}).then(
				(response) => {
					let messageReceived = response.data;

					messageReceived.message.sent = moment(messageReceived.message.sent).format("H:mm");
					messageReceived.mine = $scope.ME.user.login === messageReceived.sender.user.login;
					messageReceived.status = "received";

					if ($scope.state === 'in' &&
						$scope.currentConversationId === messageReceived.conversation.id) {
						$scope.messages.unshift(messageReceived);
					}

					$scope.updatePreviews();
					$scope.getMessages();
				},
				(error) => {
					$scope.getMessages();
				});
		}
	};

	$scope.logout = () => {
		localStorage.removeItem("token");

		$scope.previews = [];
		$scope.messages = [];

		$scope.searchConversations = [];
		$scope.searchUsers = [];

		$scope.isAuth = true;
		$scope.listen = false;
	};

	$scope.changeMobileView = () => {
		if (!$scope.isLeftView) {
			$scope.state = "out";
			$scope.currentConversationId = null;
		}

		$scope.isLeftView = !$scope.isLeftView;
	}

});