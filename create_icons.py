from PIL import Image, ImageDraw, ImageFont
import os

def create_professional_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Modern gradient background
    margin = max(2, size // 16)
    radius = size // 6
    
    # Create gradient effect with multiple rectangles
    for i in range(size):
        alpha = int(255 * (1 - i / size * 0.3))
        color = (37, 99, 235, alpha)  # Professional blue
        draw.rectangle([margin, margin + i, size - margin, margin + i + 1], fill=color)
    
    # Draw rounded rectangle overlay
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=None,
        outline=(29, 78, 216, 255),  # Darker blue border
        width=max(1, size // 32)
    )
    
    # Draw modern link symbol
    center = size // 2
    link_thickness = max(2, size // 16)
    link_size = size // 4
    
    # First link (left)
    x1 = center - link_size
    y1 = center - link_size // 2
    x2 = center - link_size // 4
    y2 = center + link_size // 2
    
    draw.rounded_rectangle(
        [x1, y1, x2, y2],
        radius=link_thickness,
        fill=None,
        outline=(255, 255, 255, 255),
        width=link_thickness
    )
    
    # Second link (right)
    x1 = center + link_size // 4
    x2 = center + link_size
    
    draw.rounded_rectangle(
        [x1, y1, x2, y2],
        radius=link_thickness,
        fill=None,
        outline=(255, 255, 255, 255),
        width=link_thickness
    )
    
    # Connection line
    draw.line(
        [center - link_size // 4, center, center + link_size // 4, center],
        fill=(255, 255, 255, 255),
        width=link_thickness
    )
    
    # Add subtle highlight
    highlight_size = size // 8
    draw.ellipse(
        [size // 3, size // 4, size // 3 + highlight_size, size // 4 + highlight_size],
        fill=(255, 255, 255, 80)
    )
    
    img.save(filename, 'PNG')
    print(f"Created professional {filename} ({size}x{size})")

# Create all required icon sizes
for size in [16, 32, 48, 128]:
    create_professional_icon(size, f'icons/icon{size}.png')

print("Professional icons created successfully!")