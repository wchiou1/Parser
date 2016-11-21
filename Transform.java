import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.PrintWriter;
import java.io.Reader;

import javax.swing.JOptionPane;

import com.google.gson.Gson;

public class Transform{
	
	/******************************************************************************
	 *  A bare-bones collection of static methods for manipulating
	 *  matrices.
	 *http://introcs.cs.princeton.edu/java/22library/Matrix.java.html
	 ******************************************************************************

   // return n-by-n identity matrix I
    private static double[][] identity(int n) {
        double[][] a = new double[n][n];
        for (int i = 0; i < n; i++)
            a[i][i] = 1;
        return a;
    }
	
    // return c = a * b
    private static double[][] multiply(double[][] a, double[][] b) {
        int m1 = a.length;
        int n1 = a[0].length;
        int m2 = b.length;
        int n2 = b[0].length;
        if (n1 != m2) throw new RuntimeException("Illegal matrix dimensions.");
        double[][] c = new double[m1][n2];
        for (int i = 0; i < m1; i++)
            for (int j = 0; j < n2; j++)
                for (int k = 0; k < n1; k++)
                    c[i][j] += a[i][k] * b[k][j];
        return c;
    }

    // matrix-vector multiplication (y = A * x)
    private static double[] multiply(double[][] a, double[] x) {
        int m = a.length;
        int n = a[0].length;
        if (x.length != n) throw new RuntimeException("Illegal matrix dimensions.");
        double[] y = new double[m];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                y[i] += a[i][j] * x[j];
        return y;
    }

	**********End of Matrix Utility Mathods*************************************/
    
    
	private final static int DisplayResolutionX = 1280;
	private final static int DisplayResolutionY = 1024;
	private final static double BrowserResolutionX = 1706;
	private final static double BrowserResolutionY = 1365;
	private final static double XRatio = BrowserResolutionX/DisplayResolutionX;
	private final static double YRatio = BrowserResolutionY/DisplayResolutionY;
	//convert point from Tobii eyetracker coordinate to graph coordinate
	//return -1 = not looking at graph, 0 = looking at graph1, 1=looking at graph2
	// double[] result: upon return, if the return value is not 0, the graph coordinate is stored in result
	public static int GazePointToGraphPoint(double gazePointX, double gazePointY, String[] transforms, double left, double top, double width, double height,double[] result){
		double x=(gazePointX*XRatio)-left;
		double y=(gazePointY*YRatio)-top;
		int graph;
		if(x<0||x>width||y<0||y>width||transforms[0].equalsIgnoreCase("finished"))
			return -1;
		else{
			if(!transforms[1].equalsIgnoreCase("null")){
				if(x<width/2)
					graph = 0;
				else
					graph = 1;
			}else{
				graph=0;
			}
			
		}
		
		/**double[][] reverse= identity(3);*/
		String transform=transforms[graph];
		
		String [] splitTransforms=transform.split("\\)");
		if(transform.indexOf("graph_hidden")==0){
			return -1;
		}	
		for(String tstring : splitTransforms){
			if(tstring.equals("\n")) break;
			String[] nameVal=tstring.split("\\(");
			if(nameVal[0].equals("translate")){
				String[] xy=nameVal[1].split(",");
				/**reverse=Transform.multiply(new double[][]{{1,0,-Double.parseDouble(xy[0])},{0,1,-Double.parseDouble(xy[1])},{0,0,1}},reverse);*/
				x-=Double.parseDouble(xy[0]);
				y-=Double.parseDouble(xy[1]);
			}
			else if(nameVal[0].equals("scale")){
				String[] xy=nameVal[1].split(",");
				/**reverse=Transform.multiply(new double[][]{{1/Double.parseDouble(xy[0]),0,0},{0,1/Double.parseDouble(xy[xy.length-1]),0},{0,0,1}},reverse);*/
				x/=Double.parseDouble(xy[0]);
				y/=Double.parseDouble(xy[xy.length-1]);
			}else throw new RuntimeException("unusual transform string: "+transform);
		}
		
		/**double[] graphPoint=Transform.multiply(reverse,new double[]{x,y,1});
		result[0]=graphPoint[0];
		result[1]=graphPoint[1];*/
		result[0]=x;
		result[1]=y;
		
		return graph;	
	}
	
	public static boolean isGraphPointVisible(double graphX, double graphY, String transform, double left, double right, double height){

		String [] splitTransforms=transform.split("\\)");
		if(transform.indexOf("graph_hidden")==0){
			return false;
		}	
		for(int i=splitTransforms.length-1;i>=0;i--){
			String tstring=splitTransforms[i];
			if(tstring.equals("\n")) continue;
			String[] nameVal=tstring.split("\\(");
			if(nameVal[0].equals("translate")){
				String[] xy=nameVal[1].split(",");
				graphX+=Double.parseDouble(xy[0]);
				graphY+=Double.parseDouble(xy[1]);
			}
			else if(nameVal[0].equals("scale")){
				String[] xy=nameVal[1].split(",");
				graphX*=Double.parseDouble(xy[0]);
				graphY*=Double.parseDouble(xy[xy.length-1]);
			}else throw new RuntimeException("unusual transform string: "+transform);
		}

		return graphX>left && graphX<right && graphY>0 && graphY<height;
	}
	
	//test client, remove this after testing
	public static void main(String[] args){

		String inputFile=JOptionPane.showInputDialog("Enter results filename:");
		BufferedReader reader;
		NodesLocationManager NLM=new NodesLocationManager();
		try {
			reader = new BufferedReader(new FileReader(inputFile));
			PrintWriter writer=new PrintWriter("gaze-node.txt","UTF-8");
			String line;
			while ((line = reader.readLine()) != null){
		    	String[] parts=line.split("\t",-1);
		    	int qid=Integer.parseInt(parts[0]);
		    	double gazeX=Double.parseDouble(parts[2]);
		    	double gazeY=Double.parseDouble(parts[3]);
		    	String[] trans={parts[4],parts[5]};
		    	double[] result=new double[2];
				int graph=Transform.GazePointToGraphPoint(gazeX, gazeY, trans, 13, 68, 1660, 994, result);
				writer.print(qid+"\t");
				writer.print(parts[1]+"\t");
				writer.print("graph: "+graph+"\t");
				writer.print("coordinate on graph: ("+result[0]+", "+result[1]+")\t");
				Node closestNode=NLM.getClosestNode(qid,result[0],result[1]);
				if(closestNode!=null){
					double left= (graph==0)? 0 : 1660/2;
					double right= (graph==1||trans.length==1)? 1660: 1660/2;
					boolean nodeVisible=Transform.isGraphPointVisible(closestNode.x, closestNode.y, trans[graph], left, right,994);
					writer.println("\tclosest node: "+closestNode.id+"\tvisible: "+nodeVisible);
				}
				else{
					writer.println("no node within 50px radius");
				}
			}
			writer.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} 
		
		
	}
}

class NodesLocationManager{
	private String graphDataDirectory="C:\\xampp\\htdocs\\OldGraphStudy2\\php\\";//change this to your directory
	private int currentQuestion=-1;
	private Node[] nodes;
	private int maxDistance=100;
	
	public int loadNodes(int qid){
		Gson gson = new Gson();
		Reader reader = null;
		try{
			reader=new FileReader(graphDataDirectory+"graph-data"+qid+"\\graph-nodes.txt");
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			}
		nodes=gson.fromJson(reader,Node[].class);	
		//System.out.println("loaded json "+nodes.length);
		return nodes.length;
	}
	public int getNumNodes(){
		return nodes.length;
	}
	
	public Node getClosestNode(int questionID, double x, double y){
		if(currentQuestion!=questionID){
			loadNodes(questionID);
			currentQuestion=questionID;
		}
		double distance=maxDistance;
		Node closest = null;
		for(Node n:nodes){
			if(Math.abs(n.x-x)<distance&&Math.abs(n.y-y)<distance){
				double d=distance(n.x,n.y,x,y);
				if(d<distance){
					distance=d;
					closest=n;
				}
			}
		}

		return closest;

	}
	private static double distance(double x1, double y1, double x2, double y2){
		return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2, 2));
	}
}

class Node{
	int id;
	String location;
	String type;
	double x;
	double y;
}