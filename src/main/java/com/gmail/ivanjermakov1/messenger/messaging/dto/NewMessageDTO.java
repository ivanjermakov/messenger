package com.gmail.ivanjermakov1.messenger.messaging.dto;

import java.util.List;

public class NewMessageDTO {
	
	private Long senderId;
	private Long conversationId;
	private String text;
	private List<MessageDTO> forwarded;
	
	public NewMessageDTO() {
	}
	
	public NewMessageDTO(Long senderId, Long conversationId, String text, List<MessageDTO> forwarded) {
		this.senderId = senderId;
		this.conversationId = conversationId;
		this.text = text;
		this.forwarded = forwarded;
	}
	
	public Long getSenderId() {
		return senderId;
	}
	
	public void setSenderId(Long senderId) {
		this.senderId = senderId;
	}
	
	public Long getConversationId() {
		return conversationId;
	}
	
	public void setConversationId(Long conversationId) {
		this.conversationId = conversationId;
	}
	
	public String getText() {
		return text;
	}
	
	public void setText(String text) {
		this.text = text;
	}
	
	public List<MessageDTO> getForwarded() {
		return forwarded;
	}
	
	public void setForwarded(List<MessageDTO> forwarded) {
		this.forwarded = forwarded;
	}
	
}