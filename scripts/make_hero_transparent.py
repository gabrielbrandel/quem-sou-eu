from PIL import Image
from collections import deque

path = r'C:\Users\Gabriel\SpinTheWheel\public\hero.png'
img = Image.open(path).convert('RGBA')
w, h = img.size
pixels = img.load()


def is_bg(r, g, b, a):
    return a > 0 and r < 45 and g < 45 and b < 45


visited = [[False] * h for _ in range(w)]
q = deque()

for x in range(w):
    for y in (0, h - 1):
        r, g, b, a = pixels[x, y]
        if is_bg(r, g, b, a):
            q.append((x, y))
            visited[x][y] = True

for y in range(h):
    for x in (0, w - 1):
        r, g, b, a = pixels[x, y]
        if is_bg(r, g, b, a) and not visited[x][y]:
            q.append((x, y))
            visited[x][y] = True

removed = 0
while q:
    x, y = q.popleft()
    pixels[x, y] = (0, 0, 0, 0)
    removed += 1
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
            r, g, b, a = pixels[nx, ny]
            if is_bg(r, g, b, a):
                visited[nx][ny] = True
                q.append((nx, ny))

# Soft fringe near transparent neighbors
for x in range(w):
    for y in range(h):
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        if r < 70 and g < 70 and b < 70:
            has_t = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and pixels[nx, ny][3] == 0:
                    has_t = True
                    break
            if has_t:
                lum = (r + g + b) / 3
                if lum < 35:
                    pixels[x, y] = (0, 0, 0, 0)
                else:
                    na = max(0, min(255, int((lum / 70) * 180)))
                    pixels[x, y] = (r, g, b, na)

img.save(path, 'PNG')
print(f'done removed={removed} size={w}x{h}')
