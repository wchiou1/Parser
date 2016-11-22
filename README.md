# Parser
EyeTracking Study Parser Source

#### H6 Dependencies:
 * Transform.java : Contains methods to transform from browser-space into graph-space.
 * gson-2.7.jar : Library to read text in json format

This java program takes in exported data from Tobii Studio, graph tracking data from the hosted server(within the php folder of GraphStudy2, called "graph_track#.txt") and a copy of the graph data(folders within the php folder of GraphStudy2). 
The exported data must be matched to the same time graph tracking data generated from the server and the same graph data from the server to generate meaningful results.

The parser currently uses the following elements from the exported data Tobii Studio data:
 * FixationPointX
 * FIxationPointY
 * GazePointX
 * GazePointY
 * MediaWidth
 * ExportDate
 * LocalTime
 * GazeEventType
 * GazeDuration

The exported data is cross referenced with the graph tracking data via the time stamps on both files to determine where the user is looking within graph-space.
From the graph-space coordinates the coordinates are compared to the graph data from the server to determine what the closest node is.
