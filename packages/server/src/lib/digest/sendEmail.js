function main() {
    console.log('sendEmail.main() is called');
}

if (require.main === module) {
    main().then(() => process.exit());
}
