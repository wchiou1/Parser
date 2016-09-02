
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.PrintWriter;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import javax.swing.JOptionPane;


//Warning: This parser is currently untested
public class Parser{
	static String inputFile;
	public static void main(String[] args){
		inputFile=JOptionPane.showInputDialog("Enter eyeTracker filename:");
		//Read the eyetracker file
		try{
		    BufferedReader reader = new BufferedReader(new FileReader(inputFile));
		    ArrayList<TimedCoords> FixationPoints=new ArrayList<TimedCoords>();
		    int FixationPointXIndex=0;
		    int FixationPointYIndex=0;
		    int GazePointXIndex=0;
		    int GazePointYIndex=0;
		    int MediaWidthIndex=0;
		    int ExportDateIndex=0;
		    int LocalTimeIndex=0;
		    int GazeEventTypeIndex=0;
		    int GazeDurationIndex=0;
		    int MediaWidth=0;
		    int TimeIndex=0;
		    String line=reader.readLine();//Read the index line
		    String[] indicies=line.split("\t",-1);
		    for(int i=0;i<indicies.length;i++){
		    	String term=indicies[i];
		    	if(term.equalsIgnoreCase("FixationPointX (MCSpx)"))
		    		FixationPointXIndex=i;
		    	if(term.equalsIgnoreCase("FixationPointY (MCSpx)"))
		    		FixationPointYIndex=i;
		    	if(term.equalsIgnoreCase("GazeEventType"))
		    		GazeEventTypeIndex=i;
		    	if(term.equalsIgnoreCase("GazeEventDuration"))
		    		GazeDurationIndex=i;
		    	if(term.equalsIgnoreCase("GazePointX (ADCSpx)"))
		    		GazePointXIndex=i;
		    	if(term.equalsIgnoreCase("GazePointY (ADCSpx)"))
		    		GazePointYIndex=i;
		    	if(term.equalsIgnoreCase("EyeTrackerTimestamp"))
		    		TimeIndex=i;
		    	if(term.equalsIgnoreCase("LocalTimestamp"))
		    		LocalTimeIndex=i;
		    	if(term.equalsIgnoreCase("MediaWidth"))
		    		MediaWidthIndex=i;
		    	if(term.equalsIgnoreCase("ExportDate"))
		    		ExportDateIndex=i;
		    }
		    int trash=0;
		    while ((line = reader.readLine()) != null){
		    	String[] parts=line.split("\t",-1);
		    	
		    	//Get the unix time using the date and the hours+minutes+seconds
		    	String dateString = parts[ExportDateIndex]+" "+parts[LocalTimeIndex]+" GMT-04:00";
		        DateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy hh:mm:ss.SSS z");
		        Date date = dateFormat.parse(dateString);
		        long unixTime = (long) date.getTime();
		        
		        if(parts[FixationPointXIndex].length()!=0&&parts[FixationPointYIndex].length()!=0&&parts[GazeEventTypeIndex].length()!=0&&parts[GazeDurationIndex].length()!=0)
		    		System.out.println(""+unixTime+"\t"+parts[GazeEventTypeIndex]+"("+parts[FixationPointXIndex]+","+parts[FixationPointYIndex]+")|"+parts[GazeDurationIndex]);
		    	//Store the coordinate data along with the time
		    	if(parts[MediaWidthIndex].length()!=0&&parts[GazePointXIndex].length()!=0&&parts[GazePointYIndex].length()!=0)
		    		FixationPoints.add(new TimedCoords(Double.parseDouble(parts[GazePointXIndex]),
		    				Double.parseDouble(parts[GazePointYIndex]),
		    				unixTime,
		    				Integer.parseInt(parts[MediaWidthIndex])));
		    	else
		    		trash++;
		    	
		    }
		    System.out.println("GazePoints discarded:"+trash);
		    
			reader.close();
			inputFile=JOptionPane.showInputDialog("Enter graphTracker filename:");
			reader = new BufferedReader(new FileReader(inputFile));
		    ArrayList<GraphTransform> GraphMovements=new ArrayList<GraphTransform>();
			

		    reader.readLine();//Throw out the first line, for now
		    while ((line = reader.readLine()) != null){
		    	//Parse the thing
		    	String[] parts=line.split("\t", -1);
		    	//Format: Question id, timestamp, graph0 transform, graph1 transform(blank if none)
		    	if(parts.length>3)
		    		GraphMovements.add(new GraphTransform(Integer.parseInt(parts[0]),Long.parseLong(parts[1]),parts[2],parts[3]));
		    	else
		    		GraphMovements.add(new GraphTransform(Integer.parseInt(parts[0]),Long.parseLong(parts[1]),parts[2],null));
		    }
			
		    //For each tracker poll, attach the highest(time) appropriate(lower than poll time) graph transformation string
		    
		    ArrayList<String> results=new ArrayList<String>();
			
		    System.out.println("GraphMovements:"+GraphMovements.size()+"\nGazePoints:"+FixationPoints.size());
		    
			for(TimedCoords tc:FixationPoints){
				long cameraTime=tc.time;
				long tempTime=0;
				//find the closest time in the graph movement array 
				for(int i=0;i<GraphMovements.size();i++){
					
					GraphTransform gt=GraphMovements.get(i);
					//Get the first time 
					tempTime=gt.time;
					//System.out.println(cameraTime+"|"+tempTime+"\t"+(cameraTime-tempTime));
					//Test if the next iteration exists
					if(GraphMovements.size()>i+1)
						//The next iteration exists, test if the time is higher
						if(GraphMovements.get(i+1).time>=cameraTime){
							//Time is higher, use previous time
							results.add(""+gt.id+"\t"+cameraTime+"\t"+tc.x+"\t"+tc.y+"\t"+gt.transform0+"\t"+gt.transform1);
							break;
						}
				}
			}
			
			PrintWriter writer = new PrintWriter("results.txt", "UTF-8");
			for(String str:results){
				writer.println(str);
			}
			writer.close();
			
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error:\n"+e.getMessage());
			return;
		}
	}
}
class GraphTransform{
	public int id;
	public String transform0;
	public String transform1;
	public long time;
	public GraphTransform(int id,long time,String trans0,String trans1){
		this.id=id;
		this.time=time;
		this.transform0=trans0;
		this.transform1=trans1;
	}
}
class TimedCoords{
	public double x;
	public double y;
	public long time;
	public int mediaWidth;
	public TimedCoords(double x,double y, long time){
		this.x=x;
		this.y=y;
		this.time=time;
	}
	public TimedCoords(double x,double y, long time,int mediaWidth){
		this.x=x;
		this.y=y;
		this.time=time;
		this.mediaWidth=mediaWidth;
	}
}
