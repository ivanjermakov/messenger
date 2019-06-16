import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AutosizeModule} from 'ngx-autosize';
import {ArraySortPipeAsc, ArraySortPipeDesc} from './pipe/array-sort.pipe';
import {AuthComponent} from './component/routed/auth/auth.component';
import {RegisterComponent} from './component/routed/register/register.component';
import {ImageAttachmentComponent} from './component/embedded/attachment/image-attachment/image-attachment.component';
import {ProfileComponent} from './component/embedded/profile/profile.component';
import {ForwardedAttachmentComponent} from './component/embedded/attachment/forwarded-attachment/forwarded-attachment.component';
import {OverlayClickDirective} from './component/routed/messaging/overlay-click.directive';
import {OutsideClickDirective} from './component/routed/messaging/outside-click.directive';
import {ScrollTopDirective} from './component/routed/messaging/scroll-top.directive';
import {ShowAttachmentsMenuDirective} from './component/routed/messaging/show-attachments-menu.directive';
import {MessageSendDirective} from './component/routed/messaging/message-send.directive';
import {MessageComponent} from './component/embedded/message/message.component';
import {MessagingComponent} from './component/routed/messaging/messaging.component';
import {ConversationPreviewComponent} from './component/embedded/preview/conversation-preview/conversation-preview.component';
import {UserPreviewComponent} from './component/embedded/preview/user-preview/user-preview.component';

@NgModule({
	declarations: [
		AppComponent,
		AuthComponent,
		RegisterComponent,
		MessagingComponent,
		MessageComponent,
		MessageSendDirective,
		ShowAttachmentsMenuDirective,
		ScrollTopDirective,
		OutsideClickDirective,
		OverlayClickDirective,
		ArraySortPipeAsc,
		ArraySortPipeDesc,
		ForwardedAttachmentComponent,
		ProfileComponent,
		ImageAttachmentComponent,
		ConversationPreviewComponent,
		UserPreviewComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		HttpClientModule,
		AutosizeModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
