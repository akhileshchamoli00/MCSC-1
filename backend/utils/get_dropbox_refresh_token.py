import dropbox

def main():
    print("=== Dropbox Permanent Refresh Token Generator ===")
    print("This script will help you generate a permanent Refresh Token for your website.")
    print("You can get the App Key and App Secret from the Settings tab of your Dropbox App Console.")
    print("=================================================\n")
    
    app_key = input("Enter your Dropbox App Key: ").strip()
    app_secret = input("Enter your Dropbox App Secret: ").strip()
    
    # Start the offline authorization flow (token_access_type='offline' generates a refresh token)
    auth_flow = dropbox.DropboxOAuth2FlowNoRedirect(
        app_key, 
        app_secret, 
        token_access_type='offline'
    )
    
    authorize_url = auth_flow.start()
    print("\n1. Open this URL in your web browser:")
    print("-" * 60)
    print(authorize_url)
    print("-" * 60)
    print("2. Authorize the app and copy the code displayed on your screen.")
    
    auth_code = input("\n3. Paste the authorization code here: ").strip()
    
    try:
        oauth_result = auth_flow.finish(auth_code)
        print("\n" + "=" * 50)
        print("SUCCESS! Copy and paste the following lines into your backend/.env file:")
        print("=" * 50)
        print(f'DROPBOX_APP_KEY="{app_key}"')
        print(f'DROPBOX_APP_SECRET="{app_secret}"')
        print(f'DROPBOX_REFRESH_TOKEN="{oauth_result.refresh_token}"')
        print("=" * 50)
        print("\nYou can now delete DROPBOX_ACCESS_TOKEN from your .env file.")
    except Exception as e:
        print(f"\nAuthorization failed: {e}")
        # Print detailed response if it's an HTTP error from requests
        if hasattr(e, "response") and e.response is not None:
            try:
                print("Error Details:", e.response.json())
            except Exception:
                print("Error Details:", e.response.text)

if __name__ == "__main__":
    main()
