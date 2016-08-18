package EyeTrackerParser;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;

import javax.swing.JOptionPane;

public class Parser{
	static String inputFile;
	public static void main(String[] args){
		inputFile=JOptionPane.showInputDialog("Enter eyeTracker filename:");
		//Read the file
		try{
		    BufferedReader reader = new BufferedReader(new FileReader(inputFile));
		    
		    int FixationPointXIndex;
		    int FixationPointYIndex;
		    int GazePointXIndex;
		    int GazePointYIndex;
		    String line=reader.readLine();//Read the index line
		    String[] indicies=line.split(",");
		    for(int i=0;i<indicies.length;i++){
		    	String term=indicies[i];
		    	if(term.equalsIgnoreCase("FixationPointX (MCSpx)"))
		    		FixationPointXIndex=i;
		    	if(term.equalsIgnoreCase("FixationPointY (MCSpx)"))
		    		FixationPointYIndex=i;
		    	if(term.equalsIgnoreCase("GazePointX (MCSpx)"))
		    		GazePointXIndex=i;
		    	if(term.equalsIgnoreCase("GazePointX (MCSpx)"))
		    		GazePointXIndex=i;
		    }
		    System.out.println(reader.readLine());
		    while ((line = reader.readLine()) != null){
		    	//System.out.println(line);
		    }
		    
			reader.close();
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error scanning task file for labels\n"+e.getMessage());
			return;
		}
	}
}