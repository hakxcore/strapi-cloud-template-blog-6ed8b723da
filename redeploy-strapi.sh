echo "🔹 Stopping existing containers..."
sudo docker compose down

echo "🔹 Cleaning old images and build cache (optional)"
sudo docker system prune -af --volumes

echo "🔹 Rebuilding Strapi image..."
sudo docker compose build --no-cache

echo "🔹 Starting containers..."
sudo docker compose up -d

echo "✅ Redeploy complete!"
echo "🔹 Check running containers with: sudo docker ps"
echo "🔹 Check Strapi logs with: sudo docker logs -f strapi"
