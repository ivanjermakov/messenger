import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Title} from '@angular/platform-browser';


import * as moment from 'moment';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {User} from '../../../dto/User';
import {Preview} from '../../../dto/Preview';
import {Message} from '../../../dto/Message';
import {MessageAttachments} from '../../../dto/MessageAttachments';
import {ImageCompressionMode} from '../../../dto/enum/ImageCompressionMode';
import {ImageService} from '../../../service/image.service';
import {NewImage} from '../../../dto/NewImage';
import {AppComponent} from '../../../app.component';
import {MeProvider} from '../../../provider/me-provider';
import {MessageService} from '../../../service/message.service';
import {TokenProvider} from '../../../provider/token-provider';
import {PreviewService} from '../../../service/preview.service';
import {AuthService} from '../../../service/auth.service';
import {SearchService} from '../../../service/search.service';
import {CookieService} from '../../../service/cookie.service';
import {MessagingService} from '../../../service/messaging.service';
import {ConversationService} from '../../../service/conversation.service';
import {SoundNotificationService} from '../../../service/sound-notification.service';
import {UserInfoService} from '../../../service/user-info.service';
import {BackgroundUnreadService} from '../../../service/background-unread.service';
import {AvatarService} from '../../../service/avatar.service';
import {APP_TITLE, FILE_URL, MESSAGES_AMOUNT, MINUTES_AS_ONLINE_LIMIT, PREVIEWS_AMOUNT} from '../../../../../globals';
import {NewMessage} from '../../../dto/NewMessage';
import {DateService} from '../../../service/date.service';
import {NewMessageAction} from '../../../dto/action/NewMessageAction';
import {ConversationReadAction} from '../../../dto/action/ConversationReadAction';
import {MessageEditAction} from '../../../dto/action/MessageEditAction';
import {Pageable} from '../../../dto/Pageable';
import {NewDocument} from '../../../dto/NewDocument';
import {MessageImage} from '../../../dto/local/MessageImage';
import {ChatService} from '../../../service/chat.service';
import {NewChat} from '../../../dto/NewChat';
import {PreviewType} from '../../../dto/enum/PreviewType';

@Component({
	selector: 'app-messaging',
	templateUrl: './messaging.component.html',
	styleUrls: [
		'./messaging.component.scss',
		'./style/messaging.component.header-left.scss',
		'./style/messaging.component.header-right.scss',
		'./style/messaging.component.search.scss',
		'./style/messaging.component.select-message.scss',
		'./style/messaging.component.content-left.scss',
		'./style/messaging.component.conversation.scss'
	]
})
export class MessagingComponent implements OnInit {

	readonly ImageCompressionMode: typeof ImageCompressionMode = ImageCompressionMode;
	readonly ImageService: typeof ImageService = ImageService;
	readonly FILE_URL = FILE_URL;
	readonly PreviewType: typeof PreviewType = PreviewType;

	token: string;
	isPolling = false;

	me: User;

	previews: Preview[];
	messages: Message[];
	routeConversationId: number;
	currentPreview: Preview;

	messageText = '';

	searchText = '';
	searchTextChanged: Subject<string> = new Subject();

	searchUsers: User[] = [];
	searchPreviews: Preview[] = [];

	selectedMessages: Message[] = [];

	editingMessage: Message;
	currentMessageAttachments: MessageAttachments = new MessageAttachments();

	currentProfile = {
		userInfo: null,
		user: null
	};

	isLeftView = true;
	isSelectForwardTo = false;

	attachedImages: NewImage[] = [];
	attachedDocuments: NewDocument[] = [];

	messageImage: MessageImage = null;

	@ViewChild('sendMessageText') sendMessageText: ElementRef;
	@ViewChild('previewSearch') previewSearch: ElementRef;
	@ViewChild('messageWrapper') messageWrapper: ElementRef;

	@HostListener('document:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (this.messageImage) {
				this.messageImage = null;
				return;
			}

			if (this.currentProfile.user) {
				this.currentProfile.user = null;
				return;
			}

			if (this.editingMessage) {
				this.cancelEditing();
				return;
			}

			if (!this.isSelectForwardTo && this.currentMessageAttachments.forwarded.length !== 0) {
				this.currentMessageAttachments.forwarded = [];
				return;
			}

			if (this.isSelectForwardTo) {
				this.isSelectForwardTo = false;
				this.currentMessageAttachments.forwarded = [];
				return;
			}

			if (this.searchText !== '') {
				this.searchText = '';
				return;
			}

			if (this.selectedMessages.length !== 0) {
				this.deselectMessages();
				return;
			}

			if (this.currentPreview) {
				this.closeConversation();
			}
		}
	}

	@HostListener('window:focus', ['$event'])
	onFocus(event: any): void {
		this.backgroundUnreadService.resetUnreadCount();
		this.titleService.setTitle(APP_TITLE);
	}

	constructor(private app: AppComponent,
	            private route: ActivatedRoute,
	            private router: Router,
	            private titleService: Title,
	            private previewService: PreviewService,
	            private tokenProvider: TokenProvider,
	            private meProvider: MeProvider,
	            private messageService: MessageService,
	            private authService: AuthService,
	            private searchService: SearchService,
	            private cookieService: CookieService,
	            private messagingService: MessagingService,
	            private conversationService: ConversationService,
	            private chatService: ChatService,
	            private soundNotificationService: SoundNotificationService,
	            private userInfoService: UserInfoService,
	            private backgroundUnreadService: BackgroundUnreadService,
	            private avatarService: AvatarService,
	            private imageService: ImageService) {
	}

	ngOnInit() {
		this.searchTextChanged
			.pipe(debounceTime(200), distinctUntilChanged())
			.subscribe(searchText => {
				this.searchForConversationsOrUsers(searchText);
			});

		this.app.onLoad(() => {
			this.route.queryParams.subscribe(params => {
				if (!this.isPolling) {
					this.meProvider.oMe.subscribe(me => {
						return this.me = me;
					});

					this.tokenProvider.oToken.subscribe(token => {
						this.token = token;

						this.startListening();
					});
				}

				this.routeConversationId = params['id'];
				if (this.routeConversationId) {
					this.isLeftView = false;
					this.loadCurrentConversation();
				} else {
					this.isLeftView = true;
					this.currentPreview = null;
					this.messages = [];
				}

				this.updatePreviews();
			});
		});
	}

	updatePreviews() {
		this.previewService.all(this.token, new Pageable(0, PREVIEWS_AMOUNT)).subscribe(previews => {
			this.previews = previews.filter(p => p.lastMessage && !p.conversation.hidden);
		});
	}

	updateMessages() {
		this.messageService.get(this.token, this.routeConversationId, new Pageable(0, MESSAGES_AMOUNT)).subscribe(messages => {
			this.messages = messages;
		});
	}

	previewsOrSearchPreviews(): Preview[] {
		if (this.searchText === '') {
			return this.previews;
		} else {
			return this.searchPreviews;
		}
	}

	openConversation(conversationId: number) {
		if (this.currentPreview && this.currentPreview.conversation.id === conversationId) return;
		this.router.navigate(['/im'], {queryParams: {id: conversationId}});
		this.messages = null;
		this.isSelectForwardTo = false;
		this.sendMessageTextFocus();
	}

	closeConversation() {
		this.router.navigate(['/im']);
	}

	createConversation(user: User) {
		this.conversationService.create(this.token, user.login).subscribe(conversation => {
			this.openConversation(conversation.id);
		});
	}

	createChat(chatName: string) {
		let newChat = new NewChat();
		newChat.name = chatName;
		this.chatService.create(this.token, newChat).subscribe(chat => {
			this.openConversation(chat.id);
		});
	}

	searchForConversationsOrUsers(searchText: string) {
		if (searchText === '') return;

		if (searchText[0] === '@') {
			this.searchService.searchUsers(this.token, searchText)
				.subscribe(users => this.searchUsers = users);
		} else {
			this.searchService.searchConversations(this.token, searchText)
				.subscribe(conversations => this.searchPreviews = conversations);
		}
	}

	sendMessage() {
		const message = new NewMessage();
		message.senderId = this.me.id;
		message.conversationId = this.currentPreview.conversation.id;
		message.text = this.messageText;
		message.forwarded = this.currentMessageAttachments.forwarded;
		message.images = this.attachedImages;
		message.documents = this.attachedDocuments;

		if ((message.forwarded.length === 0 && message.images.length === 0 && message.documents.length === 0) && message.text.trim().length === 0) return;

		this.messageText = '';
		this.currentMessageAttachments = new MessageAttachments();

		// TODO: use temp unique id to identify temp message instead of unshifting last
		const tempViewMessage = new Message();
		tempViewMessage.sender = this.me;
		tempViewMessage.forwarded = message.forwarded;
		tempViewMessage.text = message.text;

		this.messages.unshift(tempViewMessage);

		this.messagingService.sendMessage(this.token, message).subscribe(m => {
			this.updatePreviews();
			this.messages = this.messages.filter(mes => mes.id);
			this.messages.unshift(m);
			this.attachedImages = [];
			this.attachedDocuments = [];
		});
	}

	selectMessage(message: Message, event?) {
		if (event.target.className === 'avatar') return;

		if (!message.selected) {
			message.selected = true;
			this.selectedMessages.push(message);
		} else {
			message.selected = false;
			this.selectedMessages = this.selectedMessages.filter(m => m.id !== message.id);
		}
	}

	deselectMessages() {
		this.selectedMessages.forEach(m => m.selected = false);
		this.selectedMessages = [];
	}

	deleteSelectedMessages() {
		this.messageService.delete(this.token, this.selectedMessages).subscribe(
			() => {
				this.updatePreviews();
				this.updateMessages();
			},
			error => {
				this.updatePreviews();
				this.updateMessages();
			}
		);
		this.deselectMessages();
	}

	editSelectedMessage() {
		this.editingMessage = this.selectedMessages[0];
		this.messageText = this.editingMessage.text;
		this.sendMessageTextFocus();
	}

	editMessage() {
		this.editingMessage.text = this.messageText;

		this.messagingService.editMessage(this.token, this.editingMessage).subscribe(m => {
			this.cancelEditing();
			this.messageImage = null;
		});
	}

	attachSelectedMessagesAsForwardedAttachment() {
		this.currentMessageAttachments.forwarded = this.selectedMessages;
		this.deselectMessages();
	}

	forwardSelectedMessages() {
		this.attachSelectedMessagesAsForwardedAttachment();
		this.isSelectForwardTo = true;
		this.isLeftView = true;
	}

	removeForwardedAttachment() {
		this.currentMessageAttachments.forwarded = [];
	}

	cancelEditing() {
		this.deselectMessages();
		this.editingMessage = null;
		this.messageText = '';
	}

	incrementBackgroundUnread() {
		if (document.visibilityState === 'hidden') {
			this.backgroundUnreadService.incrementUnreadCount();
			this.backgroundUnreadService.oUnreadCount.subscribe(c => {
				this.titleService.setTitle(`${APP_TITLE} ${c} new message${c === 1 ? '' : 's'}`);
			});
		}
	}

	lastSeenView(lastSeen: Date): string {
		return DateService.lastSeenView(lastSeen);
	}

	isOnline(time: Date): boolean {
		return time && moment().diff(time, 'minutes') < MINUTES_AS_ONLINE_LIMIT;
	}

	loadMoreMessages() {
		if (this.messages.length % MESSAGES_AMOUNT !== 0) return;
		const pageable = new Pageable(Math.floor(this.messages.length / MESSAGES_AMOUNT), MESSAGES_AMOUNT);
		this.messageService.get(this.token, this.currentPreview.conversation.id, pageable).subscribe(messages => {
			this.messages = this.messages.concat(messages);
		});
	}

	loadMorePreviews() {
		if (this.previews.length % PREVIEWS_AMOUNT !== 0) return;
		const pageable = new Pageable(Math.floor(this.previews.length / PREVIEWS_AMOUNT), PREVIEWS_AMOUNT);
		this.previewService.all(this.token, pageable).subscribe(previews => {
			this.previews = this.previews.concat(previews);
		});
	}

	scrollToBottom() {
		if (this.messageWrapper) this.messageWrapper.nativeElement.scrollTop = this.messageWrapper.nativeElement.scrollHeight;
	}

	openProfile(user: User) {
		this.userInfoService.get(this.token, user.id).subscribe(userInfo => {
			this.currentProfile.user = user;
			this.currentProfile.userInfo = userInfo;
		});
	}

	editProfile(userInfo) {
		this.userInfoService.edit(this.token, userInfo).subscribe(info => {
			this.uploadAvatar(userInfo.newAvatar);

			this.currentProfile.userInfo = info;
		});
	}

	uploadAvatar(avatar: File) {
		if (!avatar) {
			return;
		}

		this.avatarService.upload(this.token, avatar).subscribe(avatarResponse => {
			this.currentProfile.user.avatar = avatarResponse;
		});
	}

	removeImageAttachment(image: NewImage) {
		this.attachedImages = this.attachedImages.filter(i => i.path === image.path);
	}

	removeDocumentAttachment(document: NewDocument) {
		this.attachedDocuments = this.attachedDocuments.filter(d => d.path === document.path);
	}

	sendMessageTextFocus() {
		setTimeout(() => this.sendMessageText.nativeElement.focus(), 0);
	}

	previewSearchFocus() {
		setTimeout(() => this.previewSearch.nativeElement.focus(), 0);
	}

	deleteImageFromMessage() {
		this.imageService.delete(this.token, this.messageImage.image.id).subscribe(() => {
			this.editingMessage = this.messageImage.message;
			this.editMessage();
		});
	}

	private loadCurrentConversation() {
		this.previewService.get(this.token, this.routeConversationId).subscribe(preview => {
			this.currentPreview = preview;
			this.scrollToBottom();
		}, error => this.closeConversation());
		this.messageService.get(this.token, this.routeConversationId, new Pageable(0, MESSAGES_AMOUNT)).subscribe(messages => {
			this.searchText = '';
			this.messages = messages;
		});
	}

	private loadOrUpdatePreview(conversationId: number) {
		this.previewService.get(this.token, conversationId).subscribe(preview => {
			const existingPreview = this.previews.find(p => p.conversation.id === preview.conversation.id);
			if (existingPreview) {
				Object.assign(existingPreview, preview);
			} else {
				this.previews.push(preview);
			}
		});
	}

	private startListening() {
		this.isPolling = true;
		this.messagingService.getEvents(this.token).subscribe(action => {
			console.debug(action);
			setTimeout(() => {
				switch (action.type) {
					case 'NEW_MESSAGE':
						this.processNewMessage(action);
						break;
					case 'CONVERSATION_READ':
						this.processRead(action);
						break;
					case 'MESSAGE_EDIT':
						this.processEdit(action);
						break;
				}
				// TODO: investigate magic
			}, 100);
		});
	}

	private processNewMessage(action: NewMessageAction) {
		this.loadOrUpdatePreview(action.message.conversation.id);

		if (action.message.sender.id === this.me.id) return;

		this.incrementBackgroundUnread();
		this.soundNotificationService.notify();

		if (this.currentPreview && action.message.conversation.id === this.currentPreview.conversation.id) {
			this.messages.unshift(action.message);
		}
	}

	private processRead(action: ConversationReadAction) {
		this.loadOrUpdatePreview(action.conversation.id);

		if (action.reader.id === this.me.id) return;
		if (this.messages && this.currentPreview && action.conversation.id === this.currentPreview.conversation.id) {
			this.messages.forEach(m => m.read = true);
		}
	}

	private processEdit(action: MessageEditAction) {
		this.loadOrUpdatePreview(action.message.conversation.id);

		if (this.currentPreview && action.message.conversation.id === this.currentPreview.conversation.id) {
			const updatedMessage = this.messages.find(_m => _m.id === action.message.id);
			Object.assign(updatedMessage, action.message);
		}
	}
}
