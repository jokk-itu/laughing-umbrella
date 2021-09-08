# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:5.0.301-buster-slim-amd64 AS build
WORKDIR /app
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o out --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:5.0.7-buster-slim-amd64 AS release
WORKDIR /app
EXPOSE 80
EXPOSE 443
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://localhost:80;https://localhost:443
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Api.dll"]
