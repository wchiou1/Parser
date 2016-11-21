import java.io.BufferedReader;
import java.io.FileReader;

import javax.swing.JOptionPane;

public class Transform{
	
	/******************************************************************************
	 *  A bare-bones collection of static methods for manipulating
	 *  matrices.
	 *http://introcs.cs.princeton.edu/java/22library/Matrix.java.html
	 ******************************************************************************/

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

	/**********End of Matrix Utility Mathods*************************************/
    
    
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
		if(x<0||x>width||y<0||y>width)
			return -1;
		else{
			if(transforms.length==2){
				if(x<width/2)
					graph = 0;
				else
					graph = 1;
			}else{
				graph=0;
			}
			
		}
		
		double[][] reverse= identity(3);
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
				reverse=Transform.multiply(new double[][]{{1,0,-Double.parseDouble(xy[0])},{0,1,-Double.parseDouble(xy[1])},{0,0,1}},reverse);
			}
			else if(nameVal[0].equals("scale")){
				String[] xy=nameVal[1].split(",");
				reverse=Transform.multiply(new double[][]{{1/Double.parseDouble(xy[0]),0,0},{0,1/Double.parseDouble(xy[xy.length-1]),0},{0,0,1}},reverse);
			}else throw new RuntimeException("unusual transform string: "+transform);
		}
		
		double[] graphPoint=Transform.multiply(reverse,new double[]{x,y,1});
		result[0]=graphPoint[0];
		result[1]=graphPoint[1];
		return graph;	
	}
	

	
	
	//test client
	public static void main(String[] args){
		double[] result=new double[2];
		String[] trans={"translate(830,497)scale(1, 1)scale(1,1)translate(-415, 0)translate(-98,-102)scale(1)","translate(830,497)scale(-1, 1)scale(1,1)translate(-415, 0)translate(-98,-102)scale(1)"};
// This part is lame.....

// I hope to read .txt file, which contains gazX		
		BufferedReader br = new BufferedReader(new FileReader("file.txt"));
		try {
		    StringBuilder sb = new StringBuilder();
		    String line = br.readLine();

		    while (line != null) {
		        sb.append(line);
		        sb.append(System.lineSeparator());
		        line = br.readLine();
		    }
		    String everything = sb.toString();
		} finally {
		    br.close();
		}
//*****************I hope to make gazeX go through your GazePointToGraphPoint function to get 0 and 1
		
		for (i=0;i<length; i++ ){
			int graph=Transform.GazePointToGraphPoint(656, 487, trans, 13, 68, 1660, 994, result);
			int g[i]=graph;
			System.out.println(graph);	
		}
//*****************	
		
//calc contact switching by g[i] which is 0s and 1s
		for(i=1; i<length(g); i++){
			contactswitching[i-1]=g[i]-g[i-1];
		}
		

//detect how many contactswitching in each question
		// I hope to read .txt file, which contains question# 		
				BufferedReader br = new BufferedReader(new FileReader("file.txt"));
				try {
				    StringBuilder sb = new StringBuilder();
				    String line = br.readLine();

				    while (line != null) {
				        sb.append(line);
				        sb.append(System.lineSeparator());
				        line = br.readLine();
				    }
				    String everything = sb.toString();
				} finally {
				    br.close();
				}	
		// now br should got question# like 0000000000, 1111111111,2222, 333,4444...	
				int count=0;
				for(i=1; i<length(br); i++){
					if (br[i]-br[i-1]==0){
						count=count+ ABS(contactswitching[i-1]);// absolute value						
					}
					else{
						System.out.println(count);// different question clear the count
						count=0;
					}
				}


		
	}
}