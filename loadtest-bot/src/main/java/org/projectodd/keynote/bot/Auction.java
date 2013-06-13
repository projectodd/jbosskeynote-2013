package org.projectodd.keynote.bot;

public class Auction {
	
	private int id;
	private String title;
	private String state;
	
	private int currentBid;

	public Auction(int id, String title) {
		this.id = id;
		this.title = title;
	}
	
	public int getId() {
		return this.id;
	}
	
	public String getTitle() {
		return this.title;
	}
	
	public void setCurrentBid(int amount) {
		this.currentBid = amount;
	}
	
	public int getCurrentBid() {
		return this.currentBid;
	}
	
	public void setState(String state) {
		this.state = state;
	}
	
	public boolean isInProgress() {
		return this.state.equals( "inprogress" );
	}
	
	public boolean isPending() {
		return this.state.equals( "pending" );
	}
	
	public boolean isCompleted() {
		return this.state.equals( "completed" );
	}
	
	public String toString() {
		return this.title + " :: " + this.currentBid;
	}

}
