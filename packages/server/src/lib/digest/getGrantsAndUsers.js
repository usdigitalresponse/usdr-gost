function main() {
    console.log('getGrantsAndUsers.js.main() is called');
}

if (require.main === module) {
    main().then(() => process.exit());
}
