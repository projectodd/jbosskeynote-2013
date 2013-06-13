package org.projectodd.keynote.bot;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class Namer {
	
	public static final Namer INSTANCE = new Namer();
	
	
	private List<String> firstNames = new ArrayList<String>();
	private List<String> lastNames = new ArrayList<String>();
	
	private Random random = new Random( System.currentTimeMillis() );
	
	protected Namer() {
		loadNames( getClass().getResourceAsStream("/firstnames.txt"), this.firstNames );
		loadNames( getClass().getResourceAsStream("/lastnames.txt"), this.lastNames );
	}
	
	public String getName() {
		return firstNames.get( random.nextInt( firstNames.size() ) )+ " " +  lastNames.get( random.nextInt( lastNames.size() ));
	}

	private void loadNames(InputStream in, List<String> collection) {
		BufferedReader reader = new BufferedReader( new InputStreamReader( in ));
		
		String line = null;
		
		try {
			while ( (line = reader.readLine() ) != null ) {
				line = line.trim();
				if ( ! line.equals( "" ) ) {
					collection.add( line );
				}
			}
		} catch (IOException e) {
		}
		
	}

}
