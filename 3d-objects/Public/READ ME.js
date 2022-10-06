/*
  _____  ______          _____  __  __ ______ 
 |  __ \|  ____|   /\   |  __ \|  \/  |  ____|
 | |__) | |__     /  \  | |  | | \  / | |__   
 |  _  /|  __|   / /\ \ | |  | | |\/| |  __|  
 | | \ \| |____ / ____ \| |__| | |  | | |____ 
 |_|  \_\______/_/    \_\_____/|_|  |_|______|

This template demonstrates how you can use multiple built-in tracking
technologies to allow objects in the world to show up true to size.

---- Testing this Lens in Lens Studio ----
To preview this template correctly, please use the 
Interactive Preview option in the Preview panel.
https://docs.snap.com/lens-studio/references/guides/general/previewing-your-lens/#interactive-preview

---- What this template does under the hood ----
The template will automatically leverage the best available tracking technology
to present the object and fallback to a different one when unavailable.

1.  On devices with LiDAR, World Mesh will be used
    (Interactive preview simulates this mode).
2.  On devices without LiDAR, but with native tracking technologies,
    Multi-Surface tracking will be used.
3.  On devices without either, Surface Tracking will be used
    (Not true to size).

---- True to Size Objects ----
In order to ensure your object is accurately sized, make sure that the 
3D model itself is accurately sized from your 3D Editor. 

Note: Lens Studio units are in Centimeters.

*/
