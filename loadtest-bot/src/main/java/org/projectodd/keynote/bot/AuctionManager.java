package org.projectodd.keynote.bot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class AuctionManager {
	
	private Map<Integer,Auction> auctions = new HashMap<Integer,Auction>();
	private Random random;
	
	public AuctionManager() {
		this.random = new Random( System.currentTimeMillis() );
	}
	
	public synchronized void add(Auction auction) {
		this.auctions.put( auction.getId(), auction );
	}
	
	public synchronized void setCurrentBid(int auctionId, int amount) {
		Auction auction = this.auctions.get( auctionId );
		if ( auction != null ) {
			auction.setCurrentBid(amount);
		}
	}
	
	public synchronized int getCurrentBid(int auctionId) {
		Auction auction = this.auctions.get( auctionId );
		if ( auction != null ) {
			return auction.getCurrentBid();
		}
		return 0;
	}
	
	public synchronized void setState(int auctionId, String state) {
		Auction auction = this.auctions.get( auctionId );
		if ( auction != null ) {
			auction.setState(state);
		}
	}
	
	public Auction getRandomInProgressAuction() {
		List<Auction> auctions = new ArrayList<Auction>();
		
		for ( Auction each : this.auctions.values() ) {
			if ( each.isInProgress() ) {
				auctions.add( each );
			}
		}
		
		if ( auctions.isEmpty() ) {
			return null;
		}
		
		int which = random.nextInt( auctions.size() );
		return auctions.get( which );
	}
	

}
