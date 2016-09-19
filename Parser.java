
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
		String filename=inputFile.split("\\.")[0];
		//Read the eyetracker file
		try{
		    BufferedReader reader = new BufferedReader(new FileReader(inputFile));
		    ArrayList<TimedCoords> GazePoints=new ArrayList<TimedCoords>();
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
		        DateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy HH:mm:ss.SSS z");
		        Date date = dateFormat.parse(dateString);
		        long unixTime = (long) date.getTime();
		        
		        if(parts[FixationPointXIndex].length()!=0&&parts[FixationPointYIndex].length()!=0&&parts[GazeEventTypeIndex].length()!=0&&parts[GazeDurationIndex].length()!=0){
		    		//Check if the previous fixation point is the same as the current one.
		        	double fpx=Double.parseDouble(parts[FixationPointXIndex]);
		        	double fpy=Double.parseDouble(parts[FixationPointYIndex]);
		        	if(FixationPoints.size()==0||FixationPoints.get(FixationPoints.size()-1).x!=fpx||FixationPoints.get(FixationPoints.size()-1).y!=fpy){
		        		//The last point is different
		        		System.out.println(""+unixTime+"\t"+parts[GazeEventTypeIndex]+"("+parts[FixationPointXIndex]+","+parts[FixationPointYIndex]+")|"+parts[GazeDurationIndex]);
		        		FixationPoints.add(new TimedCoords(fpx,fpy,unixTime,Integer.parseInt(parts[GazeDurationIndex])));
		        	}
		        	
		        }
		        //Store the coordinate data along with the time
		    	if(parts[MediaWidthIndex].length()!=0&&parts[GazePointXIndex].length()!=0&&parts[GazePointYIndex].length()!=0)
		    		GazePoints.add(new TimedCoords(Double.parseDouble(parts[GazePointXIndex]),
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
		    
		    ArrayList<String> gazeResults=new ArrayList<String>();
		    ArrayList<String> fixResults=new ArrayList<String>();
			
		    System.out.println("GraphMovements:"+GraphMovements.size()+"\nGazePoints:"+GazePoints.size());
		    
		    //Time syncing for gaze points
		    long startTime = GraphMovements.get(0).time;
			for(TimedCoords tc:GazePoints){
				long cameraTime=tc.time;
				long tempTime=0;
				//find the closest time in the graph movement array 
				for(int i=0;i<GraphMovements.size();i++){
					
					GraphTransform gt=GraphMovements.get(i);
					
					//System.out.println(gt.time-tc.time);
					//Get the first time 
					tempTime=gt.time;
					//System.out.println(cameraTime+"|"+tempTime+"\t"+(cameraTime-tempTime));
					//Test if the next iteration exists
					if(GraphMovements.size()>i+1){
						//The next iteration exists, test if the time is higher
						if(GraphMovements.get(i+1).time>=cameraTime){
							//Time is higher, use previous time
							gazeResults.add(""+gt.id+"\t"+(cameraTime-startTime)+"\t"+tc.x+"\t"+tc.y+"\t"+gt.transform0+"\t"+gt.transform1);
							break;
						}
					}
					else{//We are looking at the last iteration, use it for graph transform(but only if the graph movement happened BEFORE)
						if(GraphMovements.get(i).time<=cameraTime){
							gazeResults.add(""+gt.id+"\t"+(cameraTime-startTime)+"\t"+tc.x+"\t"+tc.y+"\t"+gt.transform0+"\t"+gt.transform1);
							break;
						}
					}
				}
			}
			
			//Time syncing for fixation points
			for(TimedCoords tc:FixationPoints){
				long cameraTime=tc.time;
				long tempTime;
				//find the closest time in the graph movement array 
				for(int i=0;i<GraphMovements.size();i++){
					
					GraphTransform gt=GraphMovements.get(i);
					
					//System.out.println(gt.time-tc.time);
					//Get the first time 
					tempTime=gt.time;
					//System.out.println(cameraTime+"|"+tempTime+"\t"+(cameraTime-tempTime));
					//Test if the next iteration exists
					if(GraphMovements.size()>i+1){
						//The next iteration exists, test if the time is higher
						if(GraphMovements.get(i+1).time>=cameraTime){
							//Time is higher, use previous time
							fixResults.add(""+gt.id+"\t"+(cameraTime-startTime)+"\t"+tc.x+"\t"+tc.y+"\t"+gt.transform0+"\t"+gt.transform1+"\t"+tc.mediaWidth);
							break;
						}
					}
					else{//We are looking at the last iteration, use it for graph transform(but only if the graph movement happened BEFORE)
						if(GraphMovements.get(i).time<=cameraTime){
							fixResults.add(""+gt.id+"\t"+(cameraTime-startTime)+"\t"+tc.x+"\t"+tc.y+"\t"+gt.transform0+"\t"+gt.transform1+"\t"+tc.mediaWidth);
							break;
						}
					}
				}
			}
			//Align and determine closest node for gaze points
			
			NodesLocationManager NLM=new NodesLocationManager();
			PrintWriter writer=new PrintWriter(filename+"-gaze-nodes.txt","UTF-8");
	    	for(String parseResult:gazeResults){
				String[] parts=parseResult.split("\t",-1);
		    	int qid=Integer.parseInt(parts[0]);
		    	double gazeX=Double.parseDouble(parts[2]);
		    	double gazeY=Double.parseDouble(parts[3]);
		    	String[] trans={parts[4],parts[5]};
		    	double[] result=new double[2];
		    	//System.out.println(parseResult);
				int graph=Transform.GazePointToGraphPoint(gazeX, gazeY, trans, 13, 68, 1660, 994, result);
				writer.print(qid+"\t");
				writer.print(parts[1]+"\t");
				writer.print("graph: "+graph+"\t");
				Node closestNode=NLM.getClosestNode(qid,result[0],result[1]);
				if(closestNode!=null&&graph!=-1){
					double left= (graph==0)? 0 : 1660/2;
					double right= (graph==1||trans.length==1)? 1660: 1660/2;
					boolean nodeVisible=Transform.isGraphPointVisible(closestNode.x, closestNode.y, trans[graph], left, right,994);
					writer.println("\tclosest node: "+closestNode.id);
				}
				else{
					writer.println("no node within 50px radius found");
				}
	    	}
			writer.close();
			
			ArrayList<String> switchResults = new ArrayList<String>();
			ArrayList<String> switchNodes = new ArrayList<String>();
			
			int questionIndex=0;
			int switchCount=0;
			int previousGraph=-1;
			String prevTrans="";
			String prevX="";
			//Align and determine nodes for fixation points
			writer=new PrintWriter(filename+"-fix-nodes.txt","UTF-8");
	    	for(String parseResult:fixResults){
				String[] parts=parseResult.split("\t",-1);
				if(Integer.parseInt(parts[1])<0)
					continue;
		    	int qid=Integer.parseInt(parts[0]);
		    	double gazeX=Double.parseDouble(parts[2]);
		    	double gazeY=Double.parseDouble(parts[3]);
		    	String[] trans={parts[4],parts[5]};
		    	double[] result=new double[2];
		    	//System.out.println(parseResult);
				int graph=Transform.GazePointToGraphPoint(gazeX, gazeY, trans, 13, 68, 1660, 994, result);
				
				
				//If the previousGraph is -1 then obviously there is no context switch
				if(previousGraph!=-1&&graph!=-1){
					//Test for graph number
					if(qid==questionIndex){
						//We are still on the same question
						//Test if the graphIndex is different from previous
						if(graph!=previousGraph){
							//Graph id is not the same! Context switch detected!
							switchCount++;
							//System.out.println("Question: "+qid+"|"+switchCount);
							//System.out.println("("+previousGraph+"|"+graph+")("+prevX+"|"+parts[2]+")");
							previousGraph=graph;
						}
					}
					else{
						//We are not on the same question, context switch is impossible
						//Record count into results log
						System.out.println(questionIndex);
						System.out.println(getVisModel(prevTrans));
						switchResults.add("Question "+questionIndex+": "+switchCount+" switches\t"+getVisModel(prevTrans));
						questionIndex=qid;
						previousGraph=-1;
						switchCount=0;
					}
				}
				else{
					previousGraph=graph;//Set the previous graph
					//if the we are no longer on the same question somehow, update
					if(qid!=questionIndex){
						System.out.println(questionIndex);
						System.out.println(getVisModel(prevTrans));
						switchResults.add("Question "+questionIndex+": "+switchCount+" switches\t"+getVisModel(prevTrans));
						questionIndex=qid;
						previousGraph=-1;
						switchCount=0;
					}
				}
				prevX=parts[2];
				if(!parts[4].equalsIgnoreCase("graph_hidden"))
					prevTrans=parts[4]+"\t"+parts[5];
				writer.print(qid+"\t");
				writer.print(parts[1]+"\t");
				writer.print("graph: "+graph+"\t");
				writer.print(""+parts[6]+"\t");
				//writer.print(""+getVisModel(parts[4]+"\t"+parts[5])+"\t");
				writer.print("x: "+parts[2]+"\t");
				Node closestNode=NLM.getClosestNode(qid,result[0],result[1]);
				if(closestNode!=null&&graph!=-1){
					double left= (graph==0)? 0 : 1660/2;
					double right= (graph==1||trans.length==1)? 1660: 1660/2;
					boolean nodeVisible=Transform.isGraphPointVisible(closestNode.x, closestNode.y, trans[graph], left, right,994);
					writer.println("\tclosest node: "+closestNode.id);
				}
				else{
					writer.println("no node within 50px radius found");
				}
	    	}
	    	//System.out.println(questionIndex);
			//System.out.println(getVisModel(prevTrans));
			switchResults.add("Question "+questionIndex+": "+switchCount+" switches\t"+getVisModel(prevTrans));
	    	writer.close();
	    	
	    	writer = new PrintWriter(filename+"-switches.txt", "UTF-8");
			for(String str:switchResults){
				writer.println(str);
			}
			writer.close();
			
			
			
			

			
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error:\n"+e.getMessage());
			return;
		}
	}
	private static String getVisModel(String transform){
		System.out.println(transform);
		String[] parts=transform.split("\t");
		if(parts[0].equalsIgnoreCase("graph_hidden"))
			return "None";
		if(parts[1].equalsIgnoreCase("null"))
			return "VisGumbo";
		if(parts[1].contains("scale(-"))
			return "VisMirrors";
		return "Small Multiples";
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