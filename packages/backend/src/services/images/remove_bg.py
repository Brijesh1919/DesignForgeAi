import sys
import os
import base64
import io
import numpy as np
from rembg import remove, new_session
from PIL import Image

def main():
    try:
        # Check if arguments provided: python remove_bg.py <input_path> <output_path> [model_name]
        if len(sys.argv) >= 3:
            input_path = sys.argv[1]
            output_path = sys.argv[2]
            model_name = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "u2net"

            input_img = Image.open(input_path)
            session = new_session(model_name)

            # High-precision alpha matting for silky-smooth animal fur and hair edges
            output_img = remove(
                input_img,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )

            output_img.save(output_path, format="PNG")
            sys.exit(0)

        # Stdin/Stdout mode
        model_name = "u2net"
        if len(sys.argv) > 1 and sys.argv[1]:
            model_name = sys.argv[1]

        input_data = sys.stdin.read().strip()
        if not input_data:
            sys.stderr.write("Empty input")
            sys.exit(1)
        
        if "," in input_data:
            input_data = input_data.split(",", 1)[1]
            
        img_bytes = base64.b64decode(input_data)
        input_img = Image.open(io.BytesIO(img_bytes))
        
        session = new_session(model_name)
        output_img = remove(
            input_img,
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )
        
        buffered = io.BytesIO()
        output_img.save(buffered, format="PNG")
        output_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        sys.stdout.write(output_base64)
        sys.stdout.flush()
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
