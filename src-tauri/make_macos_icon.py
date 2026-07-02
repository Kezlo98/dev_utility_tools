#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFilter

def create_macos_icon():
    # 1. Initialize canvas (1024x1024) with complete transparency
    canvas_size = 1024
    icon = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # 2. Setup Dimensions
    # macOS squircle fits within 816x816, centered on a 1024x1024 canvas
    margin = 104
    size = canvas_size - (margin * 2) # 816
    box = [margin, margin, canvas_size - margin, canvas_size - margin]
    radius = 184
    
    # 3. Draw Shadow Layer
    # Draw a solid black squircle offset slightly downwards, then blur it
    shadow_offset_y = 12
    shadow_blur_radius = 24
    shadow_canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_canvas)
    shadow_box = [box[0], box[1] + shadow_offset_y, box[2], box[3] + shadow_offset_y]
    
    shadow_draw.rounded_rectangle(
        shadow_box, 
        radius=radius, 
        fill=(0, 0, 0, 90) # Black with ~35% opacity
    )
    # Apply Gaussian Blur to the shadow
    shadow_layer = shadow_canvas.filter(ImageFilter.GaussianBlur(shadow_blur_radius))
    
    # Merge shadow onto the main icon canvas
    icon.alpha_composite(shadow_layer)
    
    # 4. Draw Main Squircle (Background with dark gradient)
    # We render the gradient on a separate layer, then mask it into the squircle shape
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(box, radius=radius, fill=255)
    
    # Create the gradient image (charcoal #222226 to solid black #0A0A0C)
    gradient = Image.new("RGBA", (canvas_size, canvas_size))
    grad_draw = ImageDraw.Draw(gradient)
    for y in range(box[1], box[3]):
        # Interpolate between top color and bottom color
        ratio = (y - box[1]) / size
        r = int(34 - (34 - 10) * ratio)
        g = int(34 - (34 - 10) * ratio)
        b = int(38 - (38 - 12) * ratio)
        for x in range(box[0], box[2]):
            gradient.putpixel((x, y), (r, g, b, 255))
            
    # Apply the mask to paste the gradient squircle onto the icon
    icon.paste(gradient, (0, 0), mask)
    
    # 5. Draw Bevel / Inner Highlight
    # Draw a thin light border inside the squircle to simulate light catching the top edge
    highlight = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    highlight_draw = ImageDraw.Draw(highlight)
    highlight_draw.rounded_rectangle(
        box, 
        radius=radius, 
        outline=(63, 63, 70, 200), # #3F3F46 with high opacity
        width=2
    )
    icon.alpha_composite(highlight)
    
    # 6. Draw White Logo Symbol (Dot-Slash)
    # Coordinates are mathematically scaled (2.2x) and centered at (512, 512)
    logo_draw = ImageDraw.Draw(icon)
    
    # White Slash (Polygon)
    slash_points = [
        (574, 305), # Top-Right
        (512, 305), # Top-Left
        (318, 719), # Bottom-Left
        (380, 719)  # Bottom-Right
    ]
    logo_draw.polygon(slash_points, fill=(255, 255, 255, 255))
    
    # White Cursor Block (Square)
    # Spans from (556, 569) to (706, 719)
    cursor_box = [556, 569, 706, 719]
    logo_draw.rectangle(cursor_box, fill=(255, 255, 255, 255))
    
    # 7. Save outputs
    os.makedirs("../devkit_logos", exist_ok=True)
    os.makedirs("icons", exist_ok=True)
    
    # Save in devkit_logos
    icon.save("../devkit_logos/devkit_logo_macos.png", "PNG")
    # Save in tauri icons source
    icon.save("icons/source.png", "PNG")
    print("Successfully created macOS native squircle icons!")

if __name__ == "__main__":
    create_macos_icon()
