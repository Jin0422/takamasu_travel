import os
import shutil

base_dir = r"d:\wrokspace\takamasu"
target_dir = os.path.join(base_dir, "takamasu")
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

for file in os.listdir(base_dir):
    if file in ["takamasu", "README.md", ".git", "move_files.py"]:
        continue
    src = os.path.join(base_dir, file)
    dst = os.path.join(target_dir, file)
    try:
        shutil.move(src, dst)
        print(f"Moved {file}")
    except Exception as e:
        print(f"Failed to move {file}: {e}")
