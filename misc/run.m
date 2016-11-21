clear
clc
[quesnm, time, gazex]=textread('result.txt','%d %d %d',-1);
Width=1660;
Left=13;
DisplayResolutionX = 1280;
BrowserResolutionX = 1706;
XRatio = BrowserResolutionX/DisplayResolutionX;
x=(gazex*XRatio)-Left;

 for i=1: size(gazex)     
     if x(i)<(Width/2)
        x(i)=0;
     else
         x(i)=1;
     end
 end
 
 
 for i=1:size(x)-1
     count(i)=x(i+1)-x(i);
 end
 
 countnew=zeros(1,length(count)+1);
 countnew(2:end)=count(1:end);
 countnew=countnew';
 
 c=0;
 j=1;
 qn=zeros(5,1);
 for i=1:size(quesnm)-1
     if (quesnm(i+1)-quesnm(i))==0
         c=abs(countnew(i))+c;
         if i==length(quesnm)-1
           qn(j)=c
           'end'
         end
     else
         qn(j)=c;
         j=j+1;
         c=0;
     end
 end
 
 
 contactswitall=sum(abs(countnew))