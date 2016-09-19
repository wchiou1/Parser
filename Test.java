import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;


public class Test{
	
	public static void main(String[] args) throws ParseException{
		String dateString = "09/16/2016 12:30:12.345 GMT-04:00";
		DateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy HH:mm:ss.SSS z");
		Date date = dateFormat.parse(dateString);
		long unixTime = (long) date.getTime();
		System.out.println(unixTime);
	}

}