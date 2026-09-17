import sys
import base64
import io
import numpy as np
from rembg import remove, new_session
from PIL import Image

def main():
    try:
        model_name = "u2net_human_seg"
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
        
        # Human segmentation model preserves the entire person (hair, face, torso, arms, clothes, legs)
        session = new_session(model_name)
        output_img = remove(input_img, session=session)
        
        # Check if alpha channel has sufficient non-zero pixels
        alpha = np.array(output_img)[:, :, 3]
        visible_ratio = np.count_nonzero(alpha > 10) / alpha.size
        
        # If human_seg did not find a person (e.g. object/product image), fall back to general model
        if visible_ratio < 0.02 and model_name == "u2net_human_seg":
            fallback_session = new_session("u2netp")
            output_img = remove(input_img, session=fallback_session)
        
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
